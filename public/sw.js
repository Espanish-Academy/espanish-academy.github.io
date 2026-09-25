// Minimal service worker: makes Espanish installable and keeps the app shell available offline.
const CACHE = 'espanish-v1'
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll([self.registration.scope]))) })
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  // Network first, fall back to cache (so updates show up immediately).
  e.respondWith(
    fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res })
      .catch(() => caches.match(req).then(r => r || caches.match(self.registration.scope)))
  )
})
