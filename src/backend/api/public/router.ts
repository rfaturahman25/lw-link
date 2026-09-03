import { Hono } from 'hono'
import { eq, and, desc, sql, count } from 'drizzle-orm'
import { createDb } from '../../db/client'
import { users, profiles, links, sections, analyticsEvents } from '../../db/schema'
import { hashIP } from '../../utils/security'

type Bindings = { DB: D1Database }

const publicRoutes = new Hono<{ Bindings: Bindings }>()

publicRoutes.get('/:username', async (c) => {
  let username = c.req.param('username')
  // handle @ prefix and %40 encoding (canonical /@username)
  try { username = decodeURIComponent(username) } catch (_e) { /* ignore decode error */ }
  username = username.replace(/^@/, '').toLowerCase()
  const db = createDb(c.env.DB)
  const uRows = await db.select().from(users).where(eq(users.username, username)).limit(1)
  if (uRows.length === 0) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } }, 404)
  const user = uRows[0]
  if (user.status === 'disabled') return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } }, 404)
  const pRows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  const profile = pRows[0]
  if (!profile || !profile.published) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Profile not published' } }, 404)
  const lRows = await db.select().from(links).where(and(eq(links.userId, user.id), eq(links.enabled, true))).orderBy(links.position)
  const sRows = await db.select().from(sections).where(eq(sections.userId, user.id)).orderBy(sections.position)
  // filter out empty sections for public view
  const linksBySection = new Map<string | null, typeof lRows>()
  for (const l of lRows) {
    const key = l.sectionId || null
    if (!linksBySection.has(key)) linksBySection.set(key, [])
    linksBySection.get(key)!.push(l)
  }
  const visibleSections = sRows.filter((s) => (linksBySection.get(s.id) || []).length > 0)
  return c.json({
    success: true,
    data: {
      user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl },
      profile,
      links: lRows,
      sections: visibleSections,
    },
  })
})

publicRoutes.post('/:username/view', async (c) => {
  let username = c.req.param('username')
  try { username = decodeURIComponent(username) } catch (_e) { /* ignore */ }
  username = username.replace(/^@/, '').toLowerCase()
  const db = createDb(c.env.DB)
  const uRows = await db.select().from(users).where(eq(users.username, username)).limit(1)
  if (uRows.length === 0) return c.json({ success: false, error: { code: 'NOT_FOUND' } }, 404)
  const user = uRows[0]
  const pRows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  if (!pRows[0]?.published) return c.json({ success: false }, 404)
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || 'unknown'
  const ipHash = await hashIP(ip)
  await db.insert(analyticsEvents).values({
    userId: user.id,
    linkId: null,
    eventType: 'profile_view',
    userAgent: c.req.header('user-agent')?.slice(0, 500) || null,
    referrer: c.req.header('referer')?.slice(0, 500) || null,
    ipHash,
    countryCode: (c.req.header('cf-ipcountry') || null) as string | null,
  })
  return c.json({ success: true })
})

publicRoutes.post('/:username/click', async (c) => {
  let username = c.req.param('username')
  try { username = decodeURIComponent(username) } catch (_e) { /* ignore */ }
  username = username.replace(/^@/, '').toLowerCase()
  const { linkId } = await c.req.json().catch(() => ({})) as { linkId?: string }
  if (!linkId) return c.json({ success: false, error: { code: 'MISSING_LINK' } }, 400)
  const db = createDb(c.env.DB)
  const uRows = await db.select().from(users).where(eq(users.username, username)).limit(1)
  if (uRows.length === 0) return c.json({ success: false }, 404)
  const user = uRows[0]
  const lRows = await db.select().from(links).where(eq(links.id, linkId)).limit(1)
  if (lRows.length === 0 || lRows[0].userId !== user.id) return c.json({ success: false }, 404)
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || 'unknown'
  const ipHash = await hashIP(ip)
  await db.insert(analyticsEvents).values({
    userId: user.id,
    linkId,
    eventType: 'link_click',
    userAgent: c.req.header('user-agent')?.slice(0, 500) || null,
    referrer: c.req.header('referer')?.slice(0, 500) || null,
    ipHash,
    countryCode: (c.req.header('cf-ipcountry') || null) as string | null,
  })
  return c.json({ success: true })
})

export default publicRoutes
