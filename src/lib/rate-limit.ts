// Simple in-memory rate limiter for login protection
interface RateLimitEntry {
  count: number
  firstAttempt: number
  blockedUntil: number | null
}

const attempts = new Map<string, RateLimitEntry>()

// Configuration
const MAX_ATTEMPTS = 5          // Max attempts before blocking
const WINDOW_MS = 15 * 60 * 1000  // 15 minute window
const BLOCK_DURATION_MS = 30 * 60 * 1000  // 30 minute block

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts.entries()) {
    if (now - entry.firstAttempt > WINDOW_MS && !entry.blockedUntil) {
      attempts.delete(key)
    } else if (entry.blockedUntil && now > entry.blockedUntil) {
      attempts.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; blockedFor?: number } {
  const now = Date.now()
  const entry = attempts.get(identifier)

  // Check if blocked
  if (entry?.blockedUntil) {
    if (now < entry.blockedUntil) {
      const blockedFor = Math.ceil((entry.blockedUntil - now) / 1000 / 60)
      return { allowed: false, remainingAttempts: 0, blockedFor }
    }
    // Block expired, reset
    attempts.delete(identifier)
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - (entry?.count || 0) }
}

export function recordFailedAttempt(identifier: string): { blocked: boolean; blockedFor?: number } {
  const now = Date.now()
  const entry = attempts.get(identifier)

  if (!entry) {
    attempts.set(identifier, { count: 1, firstAttempt: now, blockedUntil: null })
    return { blocked: false }
  }

  // Reset if window expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(identifier, { count: 1, firstAttempt: now, blockedUntil: null })
    return { blocked: false }
  }

  entry.count++

  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS
    const blockedFor = Math.ceil(BLOCK_DURATION_MS / 1000 / 60)
    return { blocked: true, blockedFor }
  }

  return { blocked: false }
}

export function resetRateLimit(identifier: string): void {
  attempts.delete(identifier)
}
