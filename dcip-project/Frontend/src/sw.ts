/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

const PRECACHE = 'dcip-precache-v2'
const API_CACHE = 'dcip-api-v1'
const ASSETS_CACHE = 'dcip-assets-v1'
const KNOWN_CACHES = [PRECACHE, API_CACHE, ASSETS_CACHE]

self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => {
      const urls = (self.__WB_MANIFEST ?? []).map((entry) => entry.url)
      return cache.addAll(urls)
    })
  )
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !KNOWN_CACHES.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event: FetchEvent) => {
  const req = event.request
  const url = new URL(req.url)

  // Only handle GET for caching strategies; let POSTs/PATCHes pass through
  if (req.method !== 'GET') return

  // Session status must never be served from cache — always network or 503 so
  // the client catch-block can default to isOpen=true when offline.
  if (url.href.includes('/api/supervisor/session/status')) {
    event.respondWith(networkOnly(req))
    return
  }

  // Network First for all other API requests
  if (url.href.includes('/api/')) {
    event.respondWith(networkFirst(req))
    return
  }

  // Cache First for images and fonts
  if (req.destination === 'image' || req.destination === 'font') {
    event.respondWith(cacheFirst(req, ASSETS_CACHE))
    return
  }

  // Cache First from precache for app shell (HTML, JS, CSS)
  event.respondWith(precacheFirst(req))
})

async function networkOnly(req: Request): Promise<Response> {
  try {
    return await fetch(req)
  } catch {
    return new Response(JSON.stringify({ offline: true, error: 'No network' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function networkFirst(req: Request): Promise<Response> {
  try {
    const response = await fetch(req.clone())
    if (response.ok) {
      const cache = await caches.open(API_CACHE)
      cache.put(req, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(req)
    if (cached) return cached
    return new Response(JSON.stringify({ offline: true, error: 'No network' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function cacheFirst(req: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(req)
  if (cached) return cached
  try {
    const response = await fetch(req)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(req, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

async function precacheFirst(req: Request): Promise<Response> {
  const cached = await caches.match(req)
  if (cached) return cached
  try {
    return await fetch(req)
  } catch {
    const fallback = await caches.match('/index.html')
    return fallback ?? new Response('', { status: 503 })
  }
}
