const CACHE = 'scarlett-permspine-s1-v2';
const ASSETS = [
  './',
  './index.html',
  './index.js',
  './boot_spine.js',
  './spine.js',
  './diagnostics.js',
  './css/style.css',
  './manifest.json',
  './js/scarlett1/world.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    const fresh = await fetch(event.request);
    if (event.request.method === 'GET' && fresh && fresh.ok) cache.put(event.request, fresh.clone());
    return fresh;
  })());
});
