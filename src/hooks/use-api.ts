"use client"

/**
 * Custom hooks for optimized data fetching
 * Implements caching, deduplication, and automatic revalidation
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface FetchOptions {
  enabled?: boolean
  refetchInterval?: number
  staleTime?: number
  cacheKey?: string
  dedupe?: boolean
}

// Simple in-memory cache for deduplication
const requestCache = new Map<string, { data: unknown; timestamp: number; promise?: Promise<unknown> }>()
const DEFAULT_STALE_TIME = 30000 // 30 seconds

/**
 * Custom hook for data fetching with caching
 */
export function useApi<T>(
  url: string | null,
  options: FetchOptions = {}
): FetchState<T> & { refetch: () => Promise<void>; mutate: (data: T) => void } {
  const {
    enabled = true,
    refetchInterval,
    staleTime = DEFAULT_STALE_TIME,
    cacheKey,
    dedupe = true
  } = options

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null
  })

  const key = cacheKey || url || ''
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!url) {
      setState({ data: null, loading: false, error: null })
      return
    }

    // Check cache for fresh data
    if (dedupe && key) {
      const cached = requestCache.get(key)
      if (cached) {
        const isStale = Date.now() - cached.timestamp > staleTime
        if (!isStale) {
          setState({ data: cached.data as T, loading: false, error: null })
          return
        }
        // If there's an ongoing request, wait for it
        if (cached.promise) {
          try {
            const data = await cached.promise
            if (mountedRef.current) {
              setState({ data: data as T, loading: false, error: null })
            }
            return
          } catch (err) {
            // Continue with new request
          }
        }
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    const fetchPromise = fetch(url).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })

    // Store promise for deduplication
    if (dedupe && key) {
      requestCache.set(key, {
        data: requestCache.get(key)?.data,
        timestamp: requestCache.get(key)?.timestamp || 0,
        promise: fetchPromise
      })
    }

    try {
      const data = await fetchPromise

      // Update cache
      if (key) {
        requestCache.set(key, { data, timestamp: Date.now() })
      }

      if (mountedRef.current) {
        setState({ data, loading: false, error: null })
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err : new Error('Unknown error')
        })
      }
    }
  }, [url, key, staleTime, dedupe])

  // Mutate cache directly
  const mutate = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }))
    if (key) {
      requestCache.set(key, { data, timestamp: Date.now() })
    }
  }, [key])

  useEffect(() => {
    mountedRef.current = true
    if (enabled) {
      fetchData()
    }

    return () => {
      mountedRef.current = false
    }
  }, [enabled, fetchData])

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    const interval = setInterval(fetchData, refetchInterval)
    return () => clearInterval(interval)
  }, [refetchInterval, enabled, fetchData])

  return {
    ...state,
    refetch: fetchData,
    mutate
  }
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
export function useMutation<TData, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>
): {
  mutate: (variables: TVariables) => Promise<TData>
  mutateAsync: (variables: TVariables) => Promise<TData>
  loading: boolean
  error: Error | null
  data: TData | null
  reset: () => void
} {
  const [state, setState] = useState<{
    loading: boolean
    error: Error | null
    data: TData | null
  }>({
    loading: false,
    error: null,
    data: null
  })

  const mutate = useCallback(async (variables: TVariables) => {
    setState({ loading: true, error: null, data: null })

    try {
      const data = await mutationFn(variables)
      setState({ loading: false, error: null, data })
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setState({ loading: false, error, data: null })
      throw error
    }
  }, [mutationFn])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null })
  }, [])

  return {
    ...state,
    mutate,
    mutateAsync: mutate,
    reset
  }
}

/**
 * Hook for paginated data
 */
export function usePaginatedApi<T>(
  baseUrl: string,
  options: FetchOptions & { initialPage?: number; pageSize?: number } = {}
): FetchState<{ data: T[]; pagination: { page: number; totalPages: number; total: number } }> & {
  page: number
  setPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  refetch: () => Promise<void>
} {
  const { initialPage = 1, pageSize = 25, ...fetchOptions } = options
  const [page, setPage] = useState(initialPage)

  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}&limit=${pageSize}`
  const { data, loading, error, refetch } = useApi<{ data: T[]; pagination: { page: number; totalPages: number; total: number } }>(
    url,
    { ...fetchOptions, cacheKey: `${baseUrl}:${page}:${pageSize}` }
  )

  const nextPage = useCallback(() => {
    if (data?.pagination && page < data.pagination.totalPages) {
      setPage(p => p + 1)
    }
  }, [data, page])

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1)
    }
  }, [page])

  return {
    data,
    loading,
    error,
    page,
    setPage,
    nextPage,
    prevPage,
    refetch
  }
}

/**
 * Invalidate cache entries
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    requestCache.clear()
    return
  }

  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key)
    }
  }
}

/**
 * Prefetch data
 */
export async function prefetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    requestCache.set(url, { data, timestamp: Date.now() })
    return data
  } catch {
    return null
  }
}
