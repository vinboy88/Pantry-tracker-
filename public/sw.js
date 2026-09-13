/* Pantry service worker — network-first with cache fallback.
   After the first successful load, the app shell and assets work offline. */
const CACHE_NAME = 'pantry-v1'

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(respond(request))
})

async function respond(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const fresh = await fetch(request)
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone())
    }
    return fresh
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached

    if (request.mode === 'navigate') {
      return (
        (await cache.match('/index.html')) ||
        (await cache.match('/')) ||
        new Response('Pantry is offline and this page is not cached yet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        })
      )
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}
