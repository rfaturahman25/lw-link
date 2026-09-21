import { describe, it, expect } from 'vitest'
import sectionsRoutes from '@backend/api/sections/router'
import linksRoutes from '@backend/api/links/router'

type RegisteredRoute = { method: string; path: string }

function putPaths(router: unknown): string[] {
  const routes = (router as { routes?: RegisteredRoute[] }).routes ?? []
  return routes.filter((r) => r.method === 'PUT').map((r) => r.path)
}

// Hono matches routes in registration order, so a literal like `/reorder` must be
// registered before the `/:id` wildcard. When it is not, `PUT /sections/reorder`
// is captured by `PUT /:id`, answers 404, and every section drag silently snaps
// back to its original position.
describe('reorder routes are not shadowed by :id', () => {
  it('registers PUT /sections/reorder before PUT /sections/:id', () => {
    const puts = putPaths(sectionsRoutes)
    expect(puts).toContain('/reorder')
    expect(puts.indexOf('/reorder')).toBeLessThan(puts.indexOf('/:id'))
  })

  it('registers PUT /links/reorder before PUT /links/:id', () => {
    const puts = putPaths(linksRoutes)
    expect(puts).toContain('/reorder')
    expect(puts.indexOf('/reorder')).toBeLessThan(puts.indexOf('/:id'))
  })
})
