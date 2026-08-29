import { Context, Next } from 'hono'
import { validateSession, getTokenFromRequest } from '../services/auth'

export type AuthUser = {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: 'user' | 'admin' | 'super_admin'
  status: 'active' | 'disabled'
}

export function authMiddleware(required: boolean = true) {
  return async (c: Context, next: Next) => {
    const token = getTokenFromRequest(c.req.raw)
    if (!token) {
      if (!required) {
        c.set('user', null as unknown as AuthUser | null)
        await next()
        return
      }
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
    }
    const db = c.env.DB as D1Database
    if (!db) {
      return c.json({ success: false, error: { code: 'CONFIG_ERROR', message: 'DB not configured' } }, 500)
    }
    const user = await validateSession(db, token)
    if (!user) {
      if (!required) {
        c.set('user', null as unknown as AuthUser | null)
        await next()
        return
      }
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session' } }, 401)
    }
    c.set('user', user)
    await next()
  }
}

export function requireRole(...roles: AuthUser['role'][]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined
    if (!user) return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
    if (!roles.includes(user.role)) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, 403)
    }
    await next()
  }
}
