import { eq, or } from 'drizzle-orm'
import { createDb } from '../db/client'
import { users, sessions } from '../db/schema'
import { hashToken, generateToken, hashPassword, verifyPassword } from '../utils/security'

export type SessionUser = {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: 'user' | 'admin' | 'super_admin'
  status: 'active' | 'disabled'
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000

export async function findOrCreateDevUser(db: D1Database, email: string): Promise<SessionUser> {
  const drizzle = createDb(db)
  const existing = await drizzle.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    const u = existing[0]
    if (u.status === 'disabled') throw new Error('User disabled')
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: u.role as 'user' | 'admin' | 'super_admin',
      status: u.status as 'active' | 'disabled',
    }
  }
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const isAdmin = email === 'admin@example.local'
  const id = crypto.randomUUID()
  await drizzle.insert(users).values({
    id,
    email,
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    role: isAdmin ? 'admin' : 'user',
    status: 'active',
  })
  // also create profile if not exists - ignore errors
  try {
    const { profiles } = await import('../db/schema')
    await drizzle.insert(profiles).values({ userId: id, published: false })
  } catch (_e) {
    // ignore
  }
  return {
    id,
    email,
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    avatarUrl: null,
    role: isAdmin ? 'admin' : 'user',
    status: 'active',
  }
}

export async function updateLastLogin(db: D1Database, userId: string) {
  try {
    const drizzle = createDb(db)
    await drizzle.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, userId))
  } catch (_e) {
    // ignore
  }
}

export async function findUserByIdentifier(db: D1Database, identifier: string): Promise<SessionUser & { passwordHash: string | null } | null> {
  const drizzle = createDb(db)
  const isEmail = identifier.includes('@')
  // username lookup case-insensitive
  const rows = isEmail
    ? await drizzle.select().from(users).where(eq(users.email, identifier.toLowerCase())).limit(1)
    : await drizzle.select().from(users).where(eq(users.username, identifier.toLowerCase())).limit(1)
  // fallback: try both if not found (support username as email prefix)
  let row = rows[0]
  if (!row && !isEmail) {
    const alt = await drizzle.select().from(users).where(eq(users.email, identifier.toLowerCase())).limit(1)
    row = alt[0]
  }
  if (!row) return null
  // also check opposite column for robustness
  if (!row && isEmail) {
    const alt2 = await drizzle.select().from(users).where(eq(users.username, identifier.toLowerCase())).limit(1)
    row = alt2[0]
  }
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    role: row.role as 'user' | 'admin' | 'super_admin',
    status: row.status as 'active' | 'disabled',
    passwordHash: (row as unknown as { passwordHash?: string | null; password_hash?: string | null }).passwordHash ?? (row as unknown as { passwordHash?: string | null; password_hash?: string | null }).password_hash ?? null,
  } as SessionUser & { passwordHash: string | null }
}

export async function authenticateUser(db: D1Database, identifier: string, password: string): Promise<SessionUser> {
  const drizzle = createDb(db)
  // try drizzle typed
  const lower = identifier.toLowerCase()
  const rows = await drizzle.select().from(users).where(or(eq(users.email, lower), eq(users.username, lower))).limit(1) as Array<typeof users.$inferSelect & { passwordHash?: string | null }>
  if (rows.length === 0) throw new Error('Invalid credentials')
  const u = rows[0] as typeof rows[0] & { passwordHash?: string | null }
  if (u.status === 'disabled') throw new Error('User disabled')
  const hash = (u as unknown as { passwordHash: string | null }).passwordHash
  if (!hash) throw new Error('Password not set — contact admin')
  const ok = await verifyPassword(password, hash)
  if (!ok) throw new Error('Invalid credentials')
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: u.role as 'user' | 'admin' | 'super_admin',
    status: u.status as 'active' | 'disabled',
  }
}

export async function createUserWithPassword(
  db: D1Database,
  email: string,
  username: string,
  displayName: string,
  password: string,
  role: 'user' | 'admin' | 'super_admin' = 'user'
): Promise<SessionUser> {
  const drizzle = createDb(db)
  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  await drizzle.insert(users).values({ id, email: email.toLowerCase(), username: username.toLowerCase(), displayName, passwordHash, role, status: 'active' })
  try {
    const { profiles } = await import('../db/schema')
    await drizzle.insert(profiles).values({ userId: id, published: false })
  } catch (_e) {
    // ignore profile creation error
  }
  return { id, email, username, displayName, avatarUrl: null, role, status: 'active' }
}

export async function createSession(
  db: D1Database,
  userId: string,
  userAgent: string | null,
  ip: string | null
): Promise<{ token: string; expiresAt: string }> {
  const drizzle = createDb(db)
  const token = generateToken()
  const tokenHash = await hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  await drizzle.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    userAgent: userAgent?.slice(0, 500) || null,
    ipAddress: ip?.slice(0, 100) || null,
  })
  return { token, expiresAt }
}

export async function validateSession(db: D1Database, token: string): Promise<SessionUser | null> {
  const drizzle = createDb(db)
  const tokenHash = await hashToken(token)
  const rows = await drizzle.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1)
  if (rows.length === 0) return null
  const sess = rows[0]
  if (new Date(sess.expiresAt).getTime() < Date.now()) {
    await drizzle.delete(sessions).where(eq(sessions.id, sess.id))
    return null
  }
  const uRows = await drizzle.select().from(users).where(eq(users.id, sess.userId)).limit(1)
  if (uRows.length === 0) return null
  const u = uRows[0]
  if (u.status === 'disabled') return null
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: u.role as 'user' | 'admin' | 'super_admin',
    status: u.status as 'active' | 'disabled',
  }
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  const drizzle = createDb(db)
  const tokenHash = await hashToken(token)
  await drizzle.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
}

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.headers.get('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/)
  if (match) return decodeURIComponent(match[1])
  return null
}

export function sessionCookie(token: string, expiresAt: string, isProd: boolean): string {
  const expires = new Date(expiresAt).toUTCString()
  const secure = isProd ? '; Secure' : ''
  return `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}${secure}`
}

export function clearSessionCookie(isProd: boolean): string {
  const secure = isProd ? '; Secure' : ''
  return `session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`
}
