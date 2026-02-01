/**
 * Rate limiting for API protection
 * Prevents abuse and ensures fair usage
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
}

// Configurable rate limits per endpoint type
export const rateLimitConfigs = {
  default: DEFAULT_CONFIG,
  auth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 login attempts per minute
  ai: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 AI requests per minute
  export: { maxRequests: 5, windowMs: 5 * 60 * 1000 }, // 5 exports per 5 minutes
  bulk: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 bulk operations per minute
  write: { maxRequests: 50, windowMs: 60 * 1000 }, // 50 writes per minute
  read: { maxRequests: 200, windowMs: 60 * 1000 }, // 200 reads per minute
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }

  /**
   * Check if request is allowed and increment counter
   */
  check(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const key = identifier
    const entry = this.limits.get(key)

    // If no entry or expired, create new
    if (!entry || now > entry.resetAt) {
      const newEntry = {
        count: 1,
        resetAt: now + config.windowMs
      }
      this.limits.set(key, newEntry)
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: newEntry.resetAt
      }
    }

    // Increment count
    entry.count++
    this.limits.set(key, entry)

    const allowed = entry.count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - entry.count)

    return { allowed, remaining, resetAt: entry.resetAt }
  }

  /**
   * Get rate limit key for a request
   */
  static getKey(ip: string, userId?: string, endpoint?: string): string {
    const parts = [ip]
    if (userId) parts.push(userId)
    if (endpoint) parts.push(endpoint)
    return parts.join(':')
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key)
      }
    }
  }

  /**
   * Get current stats
   */
  stats(): { activeKeys: number } {
    return { activeKeys: this.limits.size }
  }

  /**
   * Reset limit for specific key
   */
  reset(key: string): void {
    this.limits.delete(key)
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Rate limit middleware helper for API routes
 */
export function checkRateLimit(
  request: Request,
  userId?: string,
  configType: keyof typeof rateLimitConfigs = 'default'
): { allowed: boolean; headers: Record<string, string> } {
  // Get IP from headers
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  const config = rateLimitConfigs[configType]
  const key = RateLimiter.getKey(ip, userId)
  const result = rateLimiter.check(key, config)

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }

  return { allowed: result.allowed, headers }
}

/**
 * Create rate limited response
 */
export function rateLimitedResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter)
      }
    }
  )
}
