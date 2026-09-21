import { Hono } from 'hono'
import { eq, and, asc } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { createDb } from '../../db/client'
import { links, sections } from '../../db/schema'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission, PERMISSIONS } from '../../middleware/rbac'
import type { AuthUser } from '../../middleware/auth'
import { linkCreateSchema, linkResolveSchema, linkUpdateSchema, reorderSchema } from '../../utils/validation'
import { resolveSmartLink } from '../../services/location'

type Bindings = { DB: D1Database }

const linksRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()

linksRoutes.use('*', authMiddleware(true), requirePermission(PERMISSIONS.LINK_READ))

linksRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser
  const db = createDb(c.env.DB)
  const rows = await db.select().from(links).where(eq(links.userId, user.id)).orderBy(asc(links.position))
  return c.json({ success: true, data: rows })
})

// POST /links/resolve - preview Smart Link metadata (place + address) for a URL
// without saving it, so the editor can show the resolved location while typing.
linksRoutes.post('/resolve', zValidator('json', linkResolveSchema), async (c) => {
  const { url } = c.req.valid('json')
  const smart = await resolveSmartLink(url)
  return c.json({ success: true, data: smart })
})

linksRoutes.post('/', zValidator('json', linkCreateSchema), async (c) => {
  const user = c.get('user') as AuthUser
  const body = c.req.valid('json')
  const db = createDb(c.env.DB)
  // Validate section ownership if provided
  if (body.sectionId) {
    const sec = await db.select().from(sections).where(and(eq(sections.id, body.sectionId), eq(sections.userId, user.id))).limit(1)
    if (!sec.length) return c.json({ success: false, error: { code: 'INVALID_SECTION', message: 'Invalid section' } }, 400)
  }
  const existing = await db.select().from(links).where(eq(links.userId, user.id))
  const maxPos = existing.reduce((m, l) => Math.max(m, l.position), 0)
  const id = crypto.randomUUID()
  // Resolve smart-link metadata once, at save time (never on public page views).
  const smart = await resolveSmartLink(body.url)
  if (smart.metadata && body.showLocation !== undefined) smart.metadata.showLocation = body.showLocation
  await db.insert(links).values({
    id,
    userId: user.id,
    title: body.title,
    url: body.url,
    type: smart.type,
    metadata: smart.metadata ? JSON.stringify(smart.metadata) : null,
    icon: body.icon || null,
    thumbnail: body.thumbnail || null,
    enabled: body.enabled ?? true,
    showUrl: body.showUrl ?? true,
    align: body.align ?? 'left',
    position: maxPos + 1,
    sectionId: body.sectionId || null,
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
  if (body.sectionId) {
    const sec = await db.select().from(sections).where(and(eq(sections.id, body.sectionId), eq(sections.userId, user.id))).limit(1)
    if (!sec.length) return c.json({ success: false, error: { code: 'INVALID_SECTION', message: 'Invalid section' } }, 400)
  }
  const rows = await db.select().from(links).where(and(eq(links.id, id), eq(links.userId, user.id))).limit(1)
  if (rows.length === 0) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Link not found' } }, 404)
  const updates: Record<string, unknown> = { ...body, updatedAt: new Date().toISOString() }
  delete updates.showLocation // not a column; merged into metadata below
  // ensure sectionId null handling
  if (body.sectionId === null) updates.sectionId = null
  // Re-resolve smart-link metadata whenever the URL changes.
  if (body.url) {
    const smart = await resolveSmartLink(body.url)
    if (smart.metadata && body.showLocation !== undefined) smart.metadata.showLocation = body.showLocation
    updates.type = smart.type
    updates.metadata = smart.metadata ? JSON.stringify(smart.metadata) : null
  } else if (body.showLocation !== undefined && rows[0].type === 'location' && rows[0].metadata) {
    // Toggle the map on an existing location link without re-resolving.
    try {
      const meta = JSON.parse(rows[0].metadata) as Record<string, unknown>
      meta.showLocation = body.showLocation
      updates.metadata = JSON.stringify(meta)
    } catch {
      // ignore malformed metadata
    }
  }
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
