import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'

import healthRoutes from './api/health'
import authRoutes from './api/auth/router'
import meRoutes from './api/me'
import profileRoutes from './api/profile/router'
import linksRoutes from './api/links/router'
import publicRoutes from './api/public/router'
import analyticsRoutes from './api/analytics/router'
import adminRoutes from './api/admin/router'
import { errorHandler } from './middleware/error'
import { requestLogger } from './middleware/logging'
import { rateLimit } from './middleware/rateLimit'

type Bindings = {
  DB: D1Database
  NODE_ENV: string
  SESSION_SECRET: string
  ALLOWED_ORIGINS: string
  APP_NAME: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requestLogger())
app.use('*', prettyJSON())
app.use('*', rateLimit({ windowMs: 60_000, max: 120 }))

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    credentials: true,
  })
)

app.use('*', async (c, next) => {
  await next()
  c.header('X-Frame-Options', 'DENY')
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  c.header('X-Content-Type-Options', 'nosniff')
  if (c.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
})

app.route('/health', healthRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/me', meRoutes)
app.route('/api/profile', profileRoutes)
app.route('/api/links', linksRoutes)
app.route('/api/public', publicRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/admin', adminRoutes)

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

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found', path: c.req.path },
    },
    404
  )
})

export default app
