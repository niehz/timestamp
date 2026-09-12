// web/sw.js — 离线缓存（仅 https 部署时生效）
const CACHE = 'timestamp-web-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches
      .open(CACHE)
      .then(async (cache) => {
        const hit = await cache.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok && res.url.startsWith(self.location.origin)) cache.put(e.request, res.clone());
        return res;
      })
      .catch(() => fetch(e.request))
  );
});