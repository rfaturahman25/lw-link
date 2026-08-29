import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

// Custom error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

// Error handler middleware
export const errorHandler = (err: Error, c: Context) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  })

  // Handle HTTPException from Hono
  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          timestamp: new Date().toISOString(),
        },
      },
      err.statusCode
    )
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: err,
          timestamp: new Date().toISOString(),
        },
      },
      400
    )
  }

  // Default error response
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: c.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(c.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString(),
      },
    },
    500
  )
}