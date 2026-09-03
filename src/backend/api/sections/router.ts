import { Hono } from 'hono'
import { eq, and, asc } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createDb } from '../../db/client'
import { sections, links } from '../../db/schema'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission, PERMISSIONS } from '../../middleware/rbac'
import type { AuthUser } from '../../middleware/auth'

type Bindings = { DB: D1Database }

const sectionsRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()

sectionsRoutes.use('*', authMiddleware(true), requirePermission(PERMISSIONS.LINK_READ))

const sectionCreateSchema = z.object({
  title: z.string().min(1).max(100).trim(),
})

const sectionUpdateSchema = z.object({
  title: z.string().min(1).max(100).trim().optional(),
})

const reorderSchema = z.object({
  orderedIds: z.array(z.string()),
})

// GET /sections - list user's sections ordered by position
sectionsRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser
  const db = createDb(c.env.DB)
  const rows = await db.select().from(sections).where(eq(sections.userId, user.id)).orderBy(asc(sections.position))
  return c.json({ success: true, data: rows })
})

// POST /sections - create
sectionsRoutes.post('/', requirePermission(PERMISSIONS.LINK_CREATE), zValidator('json', sectionCreateSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const { title } = c.req.valid('json')
  const db = createDb(c.env.DB)
  const existing = await db.select().from(sections).where(eq(sections.userId, user.id))
  const maxPos = existing.reduce((m, s) => Math.max(m, s.position), 0)
  const id = crypto.randomUUID()
  await db.insert(sections).values({ id, userId: user.id, title, position: maxPos + 1 })
  const rows = await db.select().from(sections).where(eq(sections.id, id)).limit(1)
  return c.json({ success: true, data: rows[0] }, 201)
})

// PUT /sections/:id - update title
sectionsRoutes.put('/:id', requirePermission(PERMISSIONS.LINK_UPDATE), zValidator('json', sectionUpdateSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const id = c.req.param('id')
  const body = c.req.valid('json')
  const db = createDb(c.env.DB)
  const rows = await db.select().from(sections).where(and(eq(sections.id, id), eq(sections.userId, user.id))).limit(1)
  if (!rows.length) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Section not found' } }, 404)
  await db.update(sections).set({ title: body.title, updatedAt: new Date().toISOString() }).where(eq(sections.id, id))
  const fresh = await db.select().from(sections).where(eq(sections.id, id)).limit(1)
  return c.json({ success: true, data: fresh[0] })
})

// DELETE /sections/:id - delete, move links to No Section (set section_id null)
sectionsRoutes.delete('/:id', requirePermission(PERMISSIONS.LINK_DELETE), async (c) => {
  const user = c.get('user') as AuthUser
  const id = c.req.param('id')
  const db = createDb(c.env.DB)
  const rows = await db.select().from(sections).where(and(eq(sections.id, id), eq(sections.userId, user.id))).limit(1)
  if (!rows.length) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Section not found' } }, 404)
  // Move links to No Section
  await db.update(links).set({ sectionId: null, updatedAt: new Date().toISOString() }).where(and(eq(links.sectionId, id), eq(links.userId, user.id)))
  await db.delete(sections).where(eq(sections.id, id))
  return c.json({ success: true })
})

// PUT /sections/reorder - reorder sections
sectionsRoutes.put('/reorder', requirePermission(PERMISSIONS.LINK_UPDATE), zValidator('json', reorderSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const { orderedIds } = c.req.valid('json')
  const db = createDb(c.env.DB)
  const owned = await db.select().from(sections).where(eq(sections.userId, user.id))
  const ownedIds = new Set(owned.map((s) => s.id))
  for (const sid of orderedIds) {
    if (!ownedIds.has(sid)) return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Invalid section id' } }, 403)
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(sections).set({ position: i + 1, updatedAt: new Date().toISOString() }).where(eq(sections.id, orderedIds[i]))
  }
  const rows = await db.select().from(sections).where(eq(sections.userId, user.id)).orderBy(asc(sections.position))
  return c.json({ success: true, data: rows })
})

export default sectionsRoutes
