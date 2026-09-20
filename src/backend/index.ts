import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { eq, and, ne } from 'drizzle-orm'

import healthRoutes from './api/health'
import authRoutes from './api/auth/router'
import meRoutes from './api/me'
import profileRoutes from './api/profile/router'
import linksRoutes from './api/links/router'
import sectionsRoutes from './api/sections/router'
import publicRoutes from './api/public/router'
import analyticsRoutes from './api/analytics/router'
import adminRoutes from './api/admin/router'
import uploadRoutes from './api/uploads/router'
import { errorHandler } from './middleware/error'
import { requestLogger } from './middleware/logging'
import { rateLimit } from './middleware/rateLimit'
import { createDb } from './db/client'
import { users, profiles } from './db/schema'
import {
  buildProfileSeo,
  buildSitemapXml,
  injectProfileSeo,
  readSeoFromThemeConfig,
} from './utils/seo'

type Bindings = {
  DB: D1Database
  ASSETS?: Fetcher
  MEDIA?: R2Bucket
  NODE_ENV: string
  SESSION_SECRET: string
  ALLOWED_ORIGINS: string
  APP_NAME: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requestLogger())
app.use('/api/*', prettyJSON())
app.use('/health/*', prettyJSON())
app.use('/api/*', rateLimit({ windowMs: 60_000, max: 120 }))
app.use('/health/*', rateLimit({ windowMs: 60_000, max: 120 }))

app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    credentials: true,
  })
)
app.use(
  '/health/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    credentials: true,
  })
)

app.use('*', async (c, next) => {
  await next()
  // Only set security headers for API/health to avoid immutable headers error for SPA assets
  if (c.req.path.startsWith('/api/') || c.req.path.startsWith('/health') || c.req.path.startsWith('/debug/')) {
    try {
      c.header('X-Frame-Options', 'DENY')
      c.header('X-Content-Type-Options', 'nosniff')
      c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
      c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      if (c.env.NODE_ENV === 'production') {
        c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      }
    } catch {
      // ignore immutable headers for assets
    }
  }
})

app.route('/health', healthRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/me', meRoutes)
app.route('/api/profile', profileRoutes)
app.route('/api/links', linksRoutes)
app.route('/api/sections', sectionsRoutes)
app.route('/api/public', publicRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/uploads', uploadRoutes)

// Public media: serve uploaded logos/banners from R2 (no auth). Only the uploads/ prefix.
app.get('/media/*', async (c) => {
  const bucket = (c.env as unknown as { MEDIA?: R2Bucket }).MEDIA
  const key = c.req.path.replace(/^\/media\//, '')
  if (!bucket || !key.startsWith('uploads/')) {
    return c.json({ success: false, error: { code: 'NOT_FOUND' } }, 404)
  }
  const object = await bucket.get(key)
  if (!object) return c.json({ success: false, error: { code: 'NOT_FOUND' } }, 404)
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(object.body, { headers })
})

// Dynamic sitemap of published profiles. No static asset exists at this path,
// so the Worker (not the asset layer) handles it.
app.get('/sitemap.xml', async (c) => {
  const origin = new URL(c.req.url).origin
  let usernames: string[] = []
  try {
    const db = createDb(c.env.DB)
    const rows = await db
      .select({ username: users.username })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(profiles.published, true), ne(users.status, 'disabled')))
    usernames = rows.map((r) => r.username)
  } catch {
    usernames = []
  }
  return new Response(buildSitemapXml(origin, usernames), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
})

app.get('/debug/env', (c) => {
  const keys = Object.keys(c.env as Record<string, unknown>)
  const hasAssets = !!(c.env as unknown as { ASSETS?: unknown }).ASSETS
  return c.json({ keys, hasAssets, hasDB: !!(c.env as unknown as { DB?: unknown }).DB })
})

app.get('/', (c) => {
  return c.json({
    name: 'Lensa Links API',
    version: '0.1.0',
    status: 'ok',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      me: '/api/me',
      profile: '/api/profile',
      links: '/api/links',
      public: '/api/public/:username',
      analytics: '/api/analytics',
      admin: '/api/admin/*',
    },
  })
})

app.onError(errorHandler)

app.notFound(async (c) => {
  const path = c.req.path
  // API and health should return JSON 404
  if (path.startsWith('/api/') || path.startsWith('/health')) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'The requested resource was not found', path },
      },
      404
    )
  }
  // Handle encoded @ (%40) - redirect to canonical /@username for backward compatibility
  const rawUrl = new URL(c.req.url)
  if (rawUrl.pathname.startsWith('/%40')) {
    const canonical = '/@' + rawUrl.pathname.slice(4) + rawUrl.search + rawUrl.hash
    return c.redirect(canonical, 301)
  }

  // Profile pages: inject per-profile SEO meta so crawlers that don't run JS
  // (WhatsApp, Facebook, X, Slack) see real titles/descriptions instead of the
  // generic shell. Falls back to the normal SPA response when anything is off.
  if (c.req.method === 'GET') {
    const profileMatch = path.match(/^\/@([^/]+)\/?$/)
    const assets = (c.env as unknown as { ASSETS?: Fetcher }).ASSETS
    if (profileMatch && assets) {
      try {
        const username = decodeURIComponent(profileMatch[1]).replace(/^@/, '').toLowerCase()
        const db = createDb(c.env.DB)
        const uRows = await db.select().from(users).where(eq(users.username, username)).limit(1)
        const user = uRows[0]
        if (user && user.status !== 'disabled') {
          const pRows = await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, user.id))
            .limit(1)
          const profile = pRows[0]
          if (profile?.published) {
            const indexReq = new Request(new URL('/index.html', rawUrl).toString(), {
              method: 'GET',
              headers: { Accept: 'text/html' },
            })
            const indexRes = await assets.fetch(indexReq)
            if (indexRes.ok) {
              const html = await indexRes.text()
              const seo = readSeoFromThemeConfig(profile.themeConfig)
              const meta = buildProfileSeo({
                username: user.username,
                displayName: user.displayName,
                bio: profile.bio,
                seoTitle: seo.title,
                seoDescription: seo.description,
                imageUrl: user.avatarUrl || profile.logoUrl,
                origin: rawUrl.origin,
                siteName: c.env.APP_NAME || 'Lensa Links',
              })
              return new Response(injectProfileSeo(html, meta), {
                status: 200,
                headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'Cache-Control': 'public, max-age=0, s-maxage=300',
                },
              })
            }
          }
        }
      } catch {
        // fall through to the generic SPA response
      }
    }
  }

  // SPA fallback: serve index.html via assets (for direct URL, refresh, bookmark)
  const assets = (c.env as unknown as { ASSETS?: Fetcher }).ASSETS
  if (assets) {
    try {
      // Try to fetch the requested asset first (e.g. /assets/*.js, /favicon.svg)
      const assetRes = await assets.fetch(c.req.raw)
      // Only return directly if it's a successful asset (200), not redirect/error
      if (assetRes.ok) {
        const headers = new Headers(assetRes.headers)
        return new Response(assetRes.body, { status: assetRes.status, statusText: assetRes.statusText, headers })
      }
      // For 404, fallback to SPA
      const url = new URL(c.req.url)
      const indexReq = new Request(new URL('/index.html', url).toString(), {
        method: 'GET',
        headers: { Accept: 'text/html' },
      })
      const indexRes = await assets.fetch(indexReq)
      if (indexRes.ok) {
        const headers = new Headers(indexRes.headers)
        headers.set('Content-Type', 'text/html; charset=utf-8')
        // App shell (dashboard/login/unknown): keep it out of search results.
        headers.set('X-Robots-Tag', 'noindex, nofollow')
        return new Response(indexRes.body, { status: 200, headers })
      }
      const headers2 = new Headers(indexRes.headers)
      return new Response(indexRes.body, { status: indexRes.status, headers: headers2 })
    } catch {
      // fall through to JSON 404
    }
  }
  return c.json(
    {
      success: false,
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found', path },
    },
    404
  )
})

export default app
