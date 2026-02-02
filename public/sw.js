const CACHE_NAME = "carolina-crm-v3"

// Only cache static assets, not HTML pages
const urlsToCache = [
  "/manifest.json"
]

// Paths that should NEVER be cached (auth, API, HTML pages)
const noCachePaths = [
  "/api/",
  "/login",
  "/_next/",
  "/admin/"
]

// Check if a URL should not be cached
function shouldNotCache(url) {
  const urlPath = new URL(url).pathname
  return noCachePaths.some(path => urlPath.startsWith(path)) ||
    // Don't cache HTML pages (they contain auth state)
    url.includes(".html") ||
    // Don't cache if no file extension (likely a page route)
    !urlPath.includes(".") ||
    urlPath === "/"
}

self.addEventListener("install", event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener("fetch", event => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return
  }

  const url = event.request.url

  // Never cache certain paths - always go to network
  if (shouldNotCache(url)) {
    event.respondWith(fetch(event.request))
    return
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response
        }
        return fetch(event.request).then(response => {
          // Only cache successful responses for static assets
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }
          // Only cache actual static files (js, css, images)
          const contentType = response.headers.get("content-type") || ""
          if (contentType.includes("javascript") ||
              contentType.includes("css") ||
              contentType.includes("image") ||
              contentType.includes("font")) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache)
              })
          }
          return response
        })
      })
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      // Take control of all pages immediately
      self.clients.claim(),
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      })
    ])
  )
})

// Listen for messages from the app (e.g., to clear cache on logout)
self.addEventListener("message", event => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName)
      })
    })
  }
})
