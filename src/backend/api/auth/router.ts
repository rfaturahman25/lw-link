import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { findOrCreateDevUser, createSession, validateSession, getTokenFromRequest, sessionCookie, clearSessionCookie, deleteSession } from '../../services/auth'

type Bindings = {
  DB: D1Database
  NODE_ENV: string
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
})

const authRoutes = new Hono<{ Bindings: Bindings }>()

authRoutes.get('/health', (c) => {
  return c.json({ service: 'auth', status: 'ok', mode: c.env.NODE_ENV || 'development' })
})

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email } = c.req.valid('json')
  const isDev = (c.env.NODE_ENV || 'development') === 'development'

  if (!isDev) {
    return c.json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Production auth not enabled' } }, 501)
  }

  if (!email.includes('@example.local')) {
    return c.json({ success: false, error: { code: 'INVALID_EMAIL', message: 'Development only accepts @example.local' } }, 400)
  }

  const db = c.env.DB
  if (!db) return c.json({ success: false, error: { code: 'CONFIG_ERROR' } }, 500)

  const user = await findOrCreateDevUser(db, email)
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || null
  const ua = c.req.header('user-agent') || null
  const { token, expiresAt } = await createSession(db, user.id, ua, ip)

  const isProd = c.env.NODE_ENV === 'production'
  c.header('Set-Cookie', sessionCookie(token, expiresAt, isProd))

  return c.json({
    success: true,
    data: { user, token, expiresAt },
    message: 'Development login successful',
  })
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
