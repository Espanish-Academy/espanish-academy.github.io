// Minimal service worker: makes Espanish installable and keeps the app shell available offline.
const CACHE = 'espanish-v2'
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll([self.registration.scope]))) })
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
))
self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  // Network first, fall back to cache (so updates show up immediately).
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res })
      .catch(() => caches.match(req).then(r => r || caches.match(self.registration.scope)))
  )
})

// ── Push notifications ──
self.addEventListener('push', e => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { data = { body: e.data ? e.data.text() : '' } }
  const icon = new URL('icon-192.png', self.registration.scope).href
  e.waitUntil(self.registration.showNotification(data.title || 'Espanish', {
    body: data.body || '', icon, badge: icon, tag: data.tag || undefined, renotify: !!data.tag, data: { url: data.url || '' },
  }))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const target = new URL(e.notification.data?.url || '', self.registration.scope).href
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus().then(w => ('navigate' in w ? w.navigate(target) : w))
    }
    return self.clients.openWindow(target)
  }))
})
