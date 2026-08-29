import { Hono } from 'hono'
import { eq, like, sql, desc } from 'drizzle-orm'
import { createDb } from '../../db/client'
import { users, profiles } from '../../db/schema'
import { authMiddleware, requireRole } from '../../middleware/auth'
import type { AuthUser } from '../../middleware/auth'

type Bindings = { DB: D1Database }

const adminRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()
adminRoutes.use('*', authMiddleware(true), requireRole('admin'))

adminRoutes.get('/users', async (c) => {
  const q = c.req.query('q') || ''
  const db = createDb(c.env.DB)
  const rows = q
    ? await db
        .select()
        .from(users)
        .where(like(users.username, `%${q}%`))
        .orderBy(desc(users.createdAt))
        .limit(50)
    : await db.select().from(users).orderBy(desc(users.createdAt)).limit(50)
  return c.json({ success: true, data: rows })
})

adminRoutes.put('/users/:id/status', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json() as { status: 'active' | 'disabled' }
  if (!['active', 'disabled'].includes(status)) return c.json({ success: false, error: { code: 'BAD_STATUS' } }, 400)
  const db = createDb(c.env.DB)
  await db.update(users).set({ status, updatedAt: new Date().toISOString() }).where(eq(users.id, id))
  return c.json({ success: true })
})

adminRoutes.put('/users/:id/role', async (c) => {
  const id = c.req.param('id')
  const { role } = await c.req.json() as { role: 'user' | 'admin' }
  if (!['user', 'admin'].includes(role)) return c.json({ success: false }, 400)
  const db = createDb(c.env.DB)
  await db.update(users).set({ role, updatedAt: new Date().toISOString() }).where(eq(users.id, id))
  return c.json({ success: true })
})

adminRoutes.get('/profiles', async (c) => {
  const db = createDb(c.env.DB)
  const rows = await db.select().from(profiles).limit(100)
  return c.json({ success: true, data: rows })
})

adminRoutes.put('/profiles/:id/publish', async (c) => {
  const id = c.req.param('id')
  const { published } = await c.req.json() as { published: boolean }
  const db = createDb(c.env.DB)
  await db.update(profiles).set({ published: !!published, updatedAt: new Date().toISOString() }).where(eq(profiles.id, id))
  return c.json({ success: true })
})

export default adminRoutes
