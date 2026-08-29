import { Context, Next } from 'hono'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(opts: { windowMs: number; max: number; keyPrefix?: string } = { windowMs: 60_000, max: 60 }) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || c.req.header('x-real-ip') || 'unknown'
    const key = `${opts.keyPrefix || 'rl'}:${ip}:${c.req.path.split('/').slice(0, 3).join('/')}`
    const now = Date.now()
    const b = buckets.get(key)
    if (!b || now > b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
      c.header('X-RateLimit-Limit', String(opts.max))
      c.header('X-RateLimit-Remaining', String(opts.max - 1))
      await next()
      return
    }
    if (b.count >= opts.max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000)
      c.header('Retry-After', String(retryAfter))
      return c.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' } }, 429)
    }
    b.count++
    c.header('X-RateLimit-Limit', String(opts.max))
    c.header('X-RateLimit-Remaining', String(opts.max - b.count))
    await next()
  }
}

// Periodic cleanup to avoid memory leak (only in workers where setInterval available via scheduler)
// In Cloudflare Workers, global scope persists; we clean opportunistically
export function cleanupBuckets() {
  const now = Date.now()
  for (const [k, v] of buckets.entries()) if (now > v.resetAt) buckets.delete(k)
}
