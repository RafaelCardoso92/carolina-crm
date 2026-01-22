/**
 * General API rate limiter for data modification endpoints
 * Uses a sliding window approach with in-memory storage
 */

interface RateLimitConfig {
  maxRequests: number    // Max requests in window
  windowMs: number       // Window duration in milliseconds
}

interface RateLimitEntry {
  requests: number[]     // Timestamps of requests
}

const store = new Map<string, RateLimitEntry>()

// Preset configurations
export const RATE_LIMITS = {
  // Strict: For sensitive operations like bulk deletes
  strict: { maxRequests: 10, windowMs: 60 * 1000 },      // 10 per minute
  // Standard: For normal CRUD operations
  standard: { maxRequests: 30, windowMs: 60 * 1000 },   // 30 per minute
  // Relaxed: For read-heavy endpoints
  relaxed: { maxRequests: 100, windowMs: 60 * 1000 },   // 100 per minute
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const maxWindow = Math.max(...Object.values(RATE_LIMITS).map(r => r.windowMs))
  
  for (const [key, entry] of store.entries()) {
    // Remove entries with no recent requests
    const recentRequests = entry.requests.filter(t => now - t < maxWindow)
    if (recentRequests.length === 0) {
      store.delete(key)
    } else {
      entry.requests = recentRequests
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if a request is allowed under the rate limit
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param endpoint - Endpoint identifier for tracking
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry-after time if blocked
 */
export function checkApiRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): { allowed: boolean; retryAfter?: number; remaining: number } {
  const key = `${identifier}:${endpoint}`
  const now = Date.now()
  
  let entry = store.get(key)
  if (!entry) {
    entry = { requests: [] }
    store.set(key, entry)
  }
  
  // Filter to only requests within the window
  entry.requests = entry.requests.filter(t => now - t < config.windowMs)
  
  const remaining = Math.max(0, config.maxRequests - entry.requests.length)
  
  if (entry.requests.length >= config.maxRequests) {
    // Find when the oldest request will expire
    const oldestRequest = Math.min(...entry.requests)
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000)
    return { allowed: false, retryAfter, remaining: 0 }
  }
  
  // Record this request
  entry.requests.push(now)
  
  return { allowed: true, remaining: remaining - 1 }
}

/**
 * Helper to get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}
