import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createDb } from '../db/client'
import { users } from '../db/schema'
import { authMiddleware, requireRole } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'

type Bindings = { DB: D1Database }

const meRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()

meRoutes.use('*', authMiddleware(true))

meRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser
  return c.json({ success: true, data: user })
})

const updateMeSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/)
    .transform((v) => v.toLowerCase())
    .optional(),
})

meRoutes.put('/', zValidator('json', updateMeSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const body = c.req.valid('json')
  const db = createDb(c.env.DB)

  if (body.username && body.username !== user.username) {
    const existing = await db.select().from(users).where(eq(users.username, body.username)).limit(1)
    if (existing.length > 0) {
      return c.json({ success: false, error: { code: 'USERNAME_TAKEN', message: 'Username already taken' } }, 409)
    }
  }

  const updates: Record<string, unknown> = {}
  if (body.displayName) updates.displayName = body.displayName
  if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl
  if (body.username) updates.username = body.username
  if (Object.keys(updates).length === 0) {
    return c.json({ success: true, data: user })
  }
  await db.update(users).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(users.id, user.id))
  const fresh = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  const u = fresh[0]
  return c.json({
    success: true,
    data: {
      id: u.id,
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      status: u.status,
    },
  })
})

export default meRoutes
