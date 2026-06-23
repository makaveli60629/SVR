const SVR_CACHE = 'svr-pwa-install-download-lock-01';
const SVR_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/app-install.js',
  '/launch.css',
  '/launch-overrides.css',
  '/matrix.js',
  '/site-public-hooks.js',
  '/support-chat-bot.js',
  '/logo.png',
  '/logo.webp',
  '/downloads/',
  '/downloads/index.html',
  '/site/index.html',
  '/site/store.html',
  '/site/contact.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SVR_CACHE)
      .then((cache) => cache.addAll(SVR_SHELL.map((path) => new Request(path, { cache: 'reload' }))).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SVR_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Keep WebXR/game runtime network-first to avoid stale lobby/controller code.
  if (url.pathname.startsWith('/game/')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SVR_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(SVR_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
