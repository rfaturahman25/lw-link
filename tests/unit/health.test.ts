import { describe, it, expect } from 'vitest'
import app from '../../src/backend/index'

describe('Health endpoints', () => {
  it('GET /health returns ok', async () => {
    const req = new Request('http://localhost/health')
    const res = await app.fetch(req, {
      DB: undefined as unknown as D1Database,
      NODE_ENV: 'test',
      SESSION_SECRET: 'test',
      ALLOWED_ORIGINS: '*',
      APP_NAME: 'LW-link',
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as { status: string }
    expect(json.status).toBe('ok')
  })

  it('GET /api/auth/health returns ok', async () => {
    const req = new Request('http://localhost/api/auth/health')
    const res = await app.fetch(req, {
      DB: undefined as unknown as D1Database,
      NODE_ENV: 'development',
      SESSION_SECRET: 'test',
      ALLOWED_ORIGINS: '*',
      APP_NAME: 'LW-link',
    })
    expect(res.status).toBe(200)
  })
})

describe('Frontend sanity', () => {
  it('should have correct package name', async () => {
    const pkg = await import('../../package.json')
    expect(pkg.name).toBe('lw-link')
  })
})
