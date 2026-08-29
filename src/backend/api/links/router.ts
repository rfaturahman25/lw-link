import { Hono } from 'hono'
import { eq, and, asc } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { createDb } from '../../db/client'
import { links } from '../../db/schema'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission, PERMISSIONS } from '../../middleware/rbac'
import type { AuthUser } from '../../middleware/auth'
import { linkCreateSchema, linkUpdateSchema, reorderSchema } from '../../utils/validation'

type Bindings = { DB: D1Database }

const linksRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()

linksRoutes.use('*', authMiddleware(true), requirePermission(PERMISSIONS.LINK_READ))

linksRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser
  const db = createDb(c.env.DB)
  const rows = await db.select().from(links).where(eq(links.userId, user.id)).orderBy(asc(links.position))
  return c.json({ success: true, data: rows })
})

linksRoutes.post('/', zValidator('json', linkCreateSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const body = c.req.valid('json')
  const db = createDb(c.env.DB)
  const existing = await db.select().from(links).where(eq(links.userId, user.id))
  const maxPos = existing.reduce((m, l) => Math.max(m, l.position), 0)
  const id = crypto.randomUUID()
  await db.insert(links).values({
    id,
    userId: user.id,
    title: body.title,
    url: body.url,
    icon: body.icon || null,
    thumbnail: body.thumbnail || null,
    enabled: body.enabled ?? true,
    position: maxPos + 1,
  })
  const rows = await db.select().from(links).where(eq(links.id, id)).limit(1)
  return c.json({ success: true, data: rows[0] }, 201)
})

linksRoutes.put('/reorder', zValidator('json', reorderSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const { orderedIds } = c.req.valid('json')
  const db = createDb(c.env.DB)
  const owned = await db.select().from(links).where(eq(links.userId, user.id))
  const ownedIds = new Set(owned.map((l) => l.id))
  for (const id of orderedIds) {
    if (!ownedIds.has(id)) return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Invalid link id' } }, 403)
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(links).set({ position: i + 1, updatedAt: new Date().toISOString() }).where(eq(links.id, orderedIds[i]))
  }
  const rows = await db.select().from(links).where(eq(links.userId, user.id)).orderBy(asc(links.position))
  return c.json({ success: true, data: rows })
})

linksRoutes.put('/:id', zValidator('json', linkUpdateSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const id = c.req.param('id')
  const body = c.req.valid('json')
  const db = createDb(c.env.DB)
  const rows = await db.select().from(links).where(and(eq(links.id, id), eq(links.userId, user.id))).limit(1)
  if (rows.length === 0) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Link not found' } }, 404)
  const updates: Record<string, unknown> = { ...body, updatedAt: new Date().toISOString() }
  await db.update(links).set(updates).where(eq(links.id, id))
  const fresh = await db.select().from(links).where(eq(links.id, id)).limit(1)
  return c.json({ success: true, data: fresh[0] })
})

linksRoutes.put('/:id/toggle', async (c) => {
  const user = c.get('user') as AuthUser
  const id = c.req.param('id')
  const db = createDb(c.env.DB)
  const rows = await db.select().from(links).where(and(eq(links.id, id), eq(links.userId, user.id))).limit(1)
  if (rows.length === 0) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Link not found' } }, 404)
  const enabled = !rows[0].enabled
  await db.update(links).set({ enabled, updatedAt: new Date().toISOString() }).where(eq(links.id, id))
  return c.json({ success: true, data: { id, enabled } })
})

linksRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser
  const id = c.req.param('id')
  const db = createDb(c.env.DB)
  const rows = await db.select().from(links).where(and(eq(links.id, id), eq(links.userId, user.id))).limit(1)
  if (rows.length === 0) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Link not found' } }, 404)
  await db.delete(links).where(eq(links.id, id))
  return c.json({ success: true })
})

export default linksRoutes
