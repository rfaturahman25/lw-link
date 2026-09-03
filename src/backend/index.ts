import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'

import healthRoutes from './api/health'
import authRoutes from './api/auth/router'
import meRoutes from './api/me'
import profileRoutes from './api/profile/router'
import linksRoutes from './api/links/router'
import sectionsRoutes from './api/sections/router'
import publicRoutes from './api/public/router'
import analyticsRoutes from './api/analytics/router'
import adminRoutes from './api/admin/router'
import { errorHandler } from './middleware/error'
import { requestLogger } from './middleware/logging'
import { rateLimit } from './middleware/rateLimit'

type Bindings = {
  DB: D1Database
  ASSETS?: Fetcher
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

app.get('/debug/env', (c) => {
  const keys = Object.keys(c.env as Record<string, unknown>)
  const hasAssets = !!(c.env as unknown as { ASSETS?: unknown }).ASSETS
  return c.json({ keys, hasAssets, hasDB: !!(c.env as unknown as { DB?: unknown }).DB })
})

app.get('/', (c) => {
  return c.json({
    name: 'LW-link API',
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
