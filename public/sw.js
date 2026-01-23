const CACHE_NAME = "carolina-crm-v3"

self.addEventListener("install", event => {
  self.skipWaiting()
})

self.addEventListener("fetch", event => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return
  }
  
  // Skip non-http schemes (chrome-extension, etc)
  if (!event.request.url.startsWith("http")) {
    return
  }
  
  const url = new URL(event.request.url)
  
  // Never cache dynamic pages or API routes - always fetch from network
  if (url.pathname.startsWith("/api/") || 
      url.pathname === "/vendas" ||
      url.pathname === "/clientes" ||
      url.pathname === "/tarefas" ||
      url.pathname === "/prospectos" ||
      url.pathname === "/" ||
      url.pathname.startsWith("/clientes/")) {
    event.respondWith(fetch(event.request))
    return
  }
  
  // For static assets (JS, CSS, images), use network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})
