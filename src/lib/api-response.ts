/**
 * Standardized API response utilities
 */

import { NextResponse } from 'next/server'
import { logger, createTimer } from './logger'

interface ApiResponseOptions {
  status?: number
  headers?: Record<string, string>
  cache?: {
    maxAge?: number
    staleWhileRevalidate?: number
    private?: boolean
  }
}

/**
 * Create a successful JSON response
 */
export function apiSuccess<T>(data: T, options: ApiResponseOptions = {}): NextResponse<T> {
  const { status = 200, headers = {}, cache } = options

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  }

  // Add cache headers if specified
  if (cache) {
    const parts: string[] = []
    if (cache.private) parts.push('private')
    if (cache.maxAge) parts.push(`max-age=${cache.maxAge}`)
    if (cache.staleWhileRevalidate) parts.push(`stale-while-revalidate=${cache.staleWhileRevalidate}`)
    if (parts.length > 0) {
      responseHeaders['Cache-Control'] = parts.join(', ')
    }
  }

  return NextResponse.json(data, { status, headers: responseHeaders })
}

interface ApiErrorResponse {
  error: boolean
  message: string
  status: number
  details?: Record<string, unknown>
}

/**
 * Create an error response
 */
export function apiError(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    error: true,
    message,
    status
  }

  if (details) {
    body.details = details
  }

  // Log server errors
  if (status >= 500) {
    logger.error(`API Error: ${message}`, { status, details })
  }

  return NextResponse.json(body, { status })
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => apiError('Unauthorized', 401),
  forbidden: () => apiError('Forbidden', 403),
  notFound: (resource: string = 'Resource') => apiError(`${resource} not found`, 404),
  badRequest: (message: string = 'Bad request') => apiError(message, 400),
  validation: (errors: Record<string, string>) => apiError('Validation failed', 400, { errors }),
  conflict: (message: string = 'Conflict') => apiError(message, 409),
  tooManyRequests: (retryAfter: number) => apiError('Rate limit exceeded', 429, { retryAfter }),
  internal: (message: string = 'Internal server error') => apiError(message, 500),
}

/**
 * API handler wrapper with logging and error handling
 */
export function withApiHandler<T>(
  handler: (request: Request, context?: unknown) => Promise<NextResponse<T>>
) {
  return async (request: Request, context?: unknown): Promise<NextResponse<T | ApiErrorResponse>> => {
    const timer = createTimer()
    const url = new URL(request.url)

    try {
      const response = await handler(request, context)

      // Log successful request
      logger.apiRequest(
        request.method,
        url.pathname,
        response.status,
        timer.elapsed()
      )

      return response
    } catch (error) {
      const elapsed = timer.elapsed()

      if (error instanceof Error) {
        logger.logError(error, {
          method: request.method,
          path: url.pathname,
          duration: elapsed
        })

        return apiError(
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
          500
        )
      }

      return apiError('Unknown error', 500)
    }
  }
}

/**
 * Parse and validate request body
 */
export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    const body = await request.json()
    return body as T
  } catch {
    return null
  }
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field)
    }
  }

  return { valid: missing.length === 0, missing }
}
