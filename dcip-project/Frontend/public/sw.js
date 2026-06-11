const CACHE_NAME = 'dcip-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/register',
  '/login',
  '/dashboard',
  '/disciplines',
  '/portfolio',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-http requests (chrome-extension, etc.)
  if (!request.url.startsWith('http')) return

  // API requests — network first
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ message: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
    )
  )
})
