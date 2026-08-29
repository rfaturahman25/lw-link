import { Context, Next } from 'hono'

export const requestLogger = () => {
  return async (c: Context, next: Next) => {
    const start = Date.now()
    let requestId: string
    try {
      requestId = (globalThis.crypto as unknown as { randomUUID?: () => string })?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    } catch {
      requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
    
    // Add request ID to context and header
    c.set('requestId', requestId)
    c.header('X-Request-Id', requestId)
    
    // Log request
    console.log(JSON.stringify({
      type: 'request',
      requestId,
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    }))
    
    try {
      await next()
      
      // Log response
      const duration = Date.now() - start
      console.log(JSON.stringify({
        type: 'response',
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration,
        timestamp: new Date().toISOString(),
      }))
    } catch (error) {
      const duration = Date.now() - start
      
      // Log error
      console.error(JSON.stringify({
        type: 'error',
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: error instanceof Error ? error.name : 'Unknown',
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined,
      }))
      
      throw error
    }
  }
}