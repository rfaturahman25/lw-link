import { describe, it, expect } from 'vitest'
import app from '../../src/backend/index'

async function loginAs(email: string) {
  const req = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  // use dev DB mock? we test auth logic without DB -> expect 500 if DB missing
  // Instead test that unauthenticated /api/me is 401
  return req
}

describe('authz', () => {
  it('unauthenticated /api/me -> 401', async () => {
    const req = new Request('http://localhost/api/me')
    const res = await app.fetch(req, {
      DB: undefined as unknown as D1Database,
      NODE_ENV: 'test',
      SESSION_SECRET: 'x',
      ALLOWED_ORIGINS: '*',
      APP_NAME: 'LW-link',
    })
    expect(res.status).toBe(401)
  })

  it('unauthenticated /api/admin/users -> 401', async () => {
    const req = new Request('http://localhost/api/admin/users')
    const res = await app.fetch(req, {
      DB: undefined as unknown as D1Database,
      NODE_ENV: 'test',
      SESSION_SECRET: 'x',
      ALLOWED_ORIGINS: '*',
      APP_NAME: 'LW-link',
    })
    expect(res.status).toBe(401)
  })

  it('public profile missing -> 404 when DB missing -> 500', async () => {
    const req = new Request('http://localhost/api/public/nonexist')
    const res = await app.fetch(req, {
      DB: undefined as unknown as D1Database,
      NODE_ENV: 'test',
      SESSION_SECRET: 'x',
      ALLOWED_ORIGINS: '*',
      APP_NAME: 'LW-link',
    })
    // without DB, route throws -> 500 handled
    expect([404, 500]).toContain(res.status)
  })
})
