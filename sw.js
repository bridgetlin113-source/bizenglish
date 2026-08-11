// BizEnglish Coach — Service Worker (network-first for HTML to avoid stale pages)
const CACHE = 'bizenglish-v12';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // activate immediately, replace old SW
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) // wipe all old caches
      .then(() => self.clients.claim())
  );
});

// Network-first: always try the network so the newest index.html/sw wins.
// Fall back to cache only when offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // never touch POST (AI backend calls)
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // let cross-origin (backend, CDN) pass through

  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
  );
});
