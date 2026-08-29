import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  NODE_ENV: string
  APP_NAME: string
}

const healthRoutes = new Hono<{ Bindings: Bindings }>()

healthRoutes.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: c.env.APP_NAME || 'LW-link',
    environment: c.env.NODE_ENV || 'development',
    version: '0.1.0',
  })
})

healthRoutes.get('/ready', async (c) => {
  try {
    const db = c.env.DB
    if (!db) {
      return c.json(
        {
          ready: false,
          database: 'not_configured',
          timestamp: new Date().toISOString(),
        },
        503
      )
    }
    const result = await db.prepare('SELECT 1 as test').first<{ test: number }>()
    if (!result || result.test !== 1) {
      throw new Error('Database connection test failed')
    }
    return c.json({
      ready: true,
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return c.json(
      {
        ready: false,
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      503
    )
  }
})

healthRoutes.get('/version', (c) => {
  return c.json({
    name: 'LW-link',
    version: '0.1.0',
    description: 'Internal Linktree-like application',
    environment: c.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

export default healthRoutes
