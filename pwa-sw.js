const SVR_PWA_CACHE = 'svr-poker-pwa-phase145-stability-v1';
const SVR_CORE_ASSETS = [
  '/manifest.webmanifest',
  '/offline.html',
  '/matrix.js',
  '/site-public-hooks.js',
  '/support-chat-bot.js',
  '/app-install.js',
  '/pwa-app-install.js',
  '/logo.png',
  '/logo.webp',
  '/site/index.html',
  '/site/app.html',
  '/site/store.html',
  '/site/contact.html',
  '/downloads/index.html',
  '/game/index.html',
  '/game/phase145_android_black_screen_recovery_lock.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SVR_PWA_CACHE)
      .then((cache) => cache.addAll(SVR_CORE_ASSETS.map((url) => new Request(url, { cache: 'reload' }))).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SVR_PWA_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(SVR_PWA_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) cache.put(request, response.clone()).catch(() => undefined);
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return cache.match('/offline.html');
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(SVR_PWA_CACHE);
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || url.pathname.startsWith('/game/') || /app-install\.js|pwa-app-install\.js|manifest\.webmanifest/i.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(css|png|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
