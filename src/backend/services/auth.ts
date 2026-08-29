import { eq, and } from 'drizzle-orm'
import { createDb } from '../db/client'
import { users, sessions } from '../db/schema'
import { hashToken, generateToken } from '../utils/security'

export type SessionUser = {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: 'user' | 'admin'
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
      role: u.role as 'user' | 'admin',
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
    role: u.role as 'user' | 'admin',
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
