/**
 * Scalable caching layer
 * Currently uses in-memory cache, easily replaceable with Redis
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  tags: string[]
}

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Tags for cache invalidation
}

const DEFAULT_TTL = 300 // 5 minutes
const MAX_ENTRIES = 1000

class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000) // Every minute
    }
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? DEFAULT_TTL
    const tags = options.tags ?? []

    // Enforce max entries
    if (this.cache.size >= MAX_ENTRIES) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttl * 1000),
      tags
    })
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all entries with a specific tag
   */
  invalidateByTag(tag: string): number {
    let count = 0
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * Invalidate multiple tags
   */
  invalidateByTags(tags: string[]): number {
    let count = 0
    for (const tag of tags) {
      count += this.invalidateByTag(tag)
    }
    return count
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_ENTRIES
    }
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, options)
    return data
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  private evictOldest(): void {
    // Evict 10% of entries (oldest by expiration)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt)

    const toEvict = Math.max(1, Math.floor(entries.length * 0.1))
    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(entries[i][0])
    }
  }
}

// Singleton instance
export const cache = new CacheManager()

// Cache key generators for consistency
export const cacheKeys = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  dashboardQuickStats: (userId: string) => `dashboard:quickstats:${userId}`,
  cliente: (id: string) => `cliente:${id}`,
  clientes: (userId: string, page: number) => `clientes:${userId}:${page}`,
  clientesList: (userId: string) => `clientes:list:${userId}`,
  prospecto: (id: string) => `prospecto:${id}`,
  prospectos: (userId: string, page: number) => `prospectos:${userId}:${page}`,
  vendas: (userId: string, mes: number, ano: number) => `vendas:${userId}:${mes}:${ano}`,
  produtos: () => `produtos:all`,
  forecast: (userId: string, mes: number, ano: number) => `forecast:${userId}:${mes}:${ano}`,
  health: (userId: string) => `health:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
}

// Cache tags for invalidation
export const cacheTags = {
  clientes: 'clientes',
  prospectos: 'prospectos',
  vendas: 'vendas',
  produtos: 'produtos',
  dashboard: 'dashboard',
  cobrancas: 'cobrancas',
  tarefas: 'tarefas',
}
