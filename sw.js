const SVR_CACHE = 'svr-pwa-phase375-android-playable';
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
  '/site/profile.html?v=phase374',
  '/site/store.html',
  '/site/contact.html',
  '/game/android.html?channel=stable&v=phase375'
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

function networkFirst(request) {
  return fetch(new Request(request, { cache: 'no-store' }))
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(SVR_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
      }
      return response;
    })
    .catch(() => caches.match(request));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const alwaysFresh = request.mode === 'navigate'
    || url.pathname.startsWith('/game/')
    || url.pathname.startsWith('/update/')
    || url.pathname === '/matrix.js'
    || url.pathname === '/support-chat-bot.js'
    || url.pathname === '/site/profile.html'
    || url.pathname.startsWith('/site/js/phase')
    || url.pathname === '/app-update-checker.js';
  if (alwaysFresh) {
    event.respondWith(networkFirst(request));
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
