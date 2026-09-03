import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { createDb } from '../../db/client'
import { profiles, users } from '../../db/schema'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission, PERMISSIONS } from '../../middleware/rbac'
import type { AuthUser } from '../../middleware/auth'
import { profileUpdateSchema } from '../../utils/validation'

type Bindings = { DB: D1Database }

const profileRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()

profileRoutes.use('*', authMiddleware(true), requirePermission(PERMISSIONS.PROFILE_MANAGE))

profileRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser
  const db = createDb(c.env.DB)
  const rows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  if (rows.length === 0) {
    // auto-create
    await db.insert(profiles).values({ userId: user.id })
    const fresh = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
    return c.json({ success: true, data: { ...fresh[0], user } })
  }
  return c.json({ success: true, data: { ...rows[0], user } })
})

profileRoutes.put('/', zValidator('json', profileUpdateSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const body = c.req.valid('json')
  const db = createDb(c.env.DB)

  // ensure exists
  const existing = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  if (existing.length === 0) {
    await db.insert(profiles).values({ userId: user.id, ...body })
  } else {
    await db.update(profiles).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(profiles.userId, user.id))
  }
  // also sync displayName/avatar if needed via users
  if (body.displayName) {
    await db.update(users).set({ displayName: body.displayName }).where(eq(users.id, user.id))
  }
  if (body.avatarUrl !== undefined) {
    await db.update(users).set({ avatarUrl: body.avatarUrl || null }).where(eq(users.id, user.id))
  }
  if (body.logoUrl !== undefined) {
    await db.update(profiles).set({ logoUrl: body.logoUrl || null }).where(eq(profiles.userId, user.id))
  }
  const rows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  return c.json({ success: true, data: rows[0] })
})

profileRoutes.put('/publish', async (c) => {
  const user = c.get('user') as AuthUser
  const db = createDb(c.env.DB)
  const body = await c.req.json().catch(() => ({})) as { published?: boolean }
  const published = !!body.published
  const rows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  if (rows.length === 0) {
    await db.insert(profiles).values({ userId: user.id, published })
  } else {
    await db.update(profiles).set({ published, updatedAt: new Date().toISOString() }).where(eq(profiles.userId, user.id))
  }
  return c.json({ success: true, data: { published } })
})

export default profileRoutes
