import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { findOrCreateDevUser, createSession, validateSession, getTokenFromRequest, sessionCookie, clearSessionCookie, deleteSession, authenticateUser, updateLastLogin } from '../../services/auth'

type Bindings = {
  DB: D1Database
  NODE_ENV: string
}

const loginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, 'Password required'),
}).refine((d) => !!(d.identifier || d.username || d.email), { message: 'Username or email required', path: ['identifier'] })

const authRoutes = new Hono<{ Bindings: Bindings }>()

authRoutes.get('/health', (c) => {
  return c.json({ service: 'auth', status: 'ok', mode: c.env.NODE_ENV || 'development' })
})

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, username, identifier, password } = c.req.valid('json')
  const rawId = (identifier || username || email || '').trim()
  if (!rawId || !password) {
    return c.json({ success: false, error: { code: 'MISSING_CREDENTIALS', message: 'Username/email and password required' } }, 400)
  }

  const db = c.env.DB
  if (!db) return c.json({ success: false, error: { code: 'CONFIG_ERROR' } }, 500)

  const isDev = (c.env.NODE_ENV || 'development') === 'development'

  // Try username/password auth first
  try {
    const user = await authenticateUser(db, rawId, password)
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || null
    const ua = c.req.header('user-agent') || null
    const { token, expiresAt } = await createSession(db, user.id, ua, ip)
    await updateLastLogin(db, user.id)
    const isProd = c.env.NODE_ENV === 'production'
    c.header('Set-Cookie', sessionCookie(token, expiresAt, isProd))
    return c.json({ success: true, data: { user, token, expiresAt }, message: 'Login successful' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid credentials'
    // Dev fallback: legacy email-only without password (findOrCreate) for @example.local if password check failed due to missing hash
    if (isDev && rawId.includes('@example.local')) {
      // allow dev login with correct seed password, but also fallback to auto-create if no hash
      // try to check if user exists without password — if passwordHash is null, create session anyway (legacy)
      // For new behavior, we already tried authenticateUser which fails if hash missing; fallback to legacy findOrCreate if password matches seed
      if (msg.includes('Password not set')) {
        const user = await findOrCreateDevUser(db, rawId)
        const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || null
        const ua = c.req.header('user-agent') || null
        const { token, expiresAt } = await createSession(db, user.id, ua, ip)
        const isProd = c.env.NODE_ENV === 'production'
        c.header('Set-Cookie', sessionCookie(token, expiresAt, isProd))
        return c.json({ success: true, data: { user, token, expiresAt }, message: 'Development login successful (legacy)' })
      }
    }
    return c.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: msg } }, 401)
  }
})

authRoutes.post('/logout', async (c) => {
  const token = getTokenFromRequest(c.req.raw)
  if (token && c.env.DB) {
    await deleteSession(c.env.DB, token).catch(() => {})
  }
  const isProd = c.env.NODE_ENV === 'production'
  c.header('Set-Cookie', clearSessionCookie(isProd))
  return c.json({ success: true, message: 'Logged out' })
})

authRoutes.get('/session', async (c) => {
  const token = getTokenFromRequest(c.req.raw)
  if (!token) return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401)
  if (!c.env.DB) return c.json({ success: false }, 500)
  const user = await validateSession(c.env.DB, token)
  if (!user) return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401)
  return c.json({ success: true, data: user })
})

export default authRoutes
