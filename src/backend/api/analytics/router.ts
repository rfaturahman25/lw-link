import { Hono } from 'hono'
import { eq, and, sql, desc, gte } from 'drizzle-orm'
import { createDb } from '../../db/client'
import { analyticsEvents, links } from '../../db/schema'
import { authMiddleware } from '../../middleware/auth'
import type { AuthUser } from '../../middleware/auth'

type Bindings = { DB: D1Database }

const analyticsRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()
analyticsRoutes.use('*', authMiddleware(true))

analyticsRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser
  const db = createDb(c.env.DB)

  const totalViews = await db.select({ cnt: sql<number>`count(*)` }).from(analyticsEvents).where(and(eq(analyticsEvents.userId, user.id), eq(analyticsEvents.eventType, 'profile_view')))
  const totalClicks = await db.select({ cnt: sql<number>`count(*)` }).from(analyticsEvents).where(and(eq(analyticsEvents.userId, user.id), eq(analyticsEvents.eventType, 'link_click')))

  const topLinks = await db
    .select({
      linkId: analyticsEvents.linkId,
      clicks: sql<number>`count(*)`,
      title: links.title,
      url: links.url,
    })
    .from(analyticsEvents)
    .leftJoin(links, eq(links.id, analyticsEvents.linkId))
    .where(and(eq(analyticsEvents.userId, user.id), eq(analyticsEvents.eventType, 'link_click')))
    .groupBy(analyticsEvents.linkId)
    .orderBy(desc(sql`count(*)`))
    .limit(10)

  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const daily = await db
    .select({
      date: sql<string>`substr(created_at,1,10)`,
      views: sql<number>`sum(case when event_type='profile_view' then 1 else 0 end)`,
      clicks: sql<number>`sum(case when event_type='link_click' then 1 else 0 end)`,
    })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.userId, user.id), gte(analyticsEvents.createdAt, sevenAgo)))
    .groupBy(sql`substr(created_at,1,10)`)
    .orderBy(sql`substr(created_at,1,10)`)

  return c.json({
    success: true,
    data: {
      totalViews: totalViews[0]?.cnt ?? 0,
      totalClicks: totalClicks[0]?.cnt ?? 0,
      topLinks,
      daily,
    },
  })
})

export default analyticsRoutes
