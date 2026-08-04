const SVR_CACHE = 'svr-poker-phase374-physical-release-truth-v1';
const SVR_SHELL = [
  '/index.html?v=phase374',
  '/manifest.webmanifest?v=phase374',
  '/logo.png',
  '/logo.webp',
  '/offline.html',
  '/game/android.html?channel=stable&v=phase374',
  '/game/index.html?platform=quest&v=phase374',
  '/game/phase374-release.json',
  '/game/modules/phase372_live_entry_recovery_lock.js?v=phase374',
  '/game/modules/phase374_physical_release_truth_lock.js?v=phase374',
  '/site/index.html?v=phase374'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SVR_CACHE)
      .then((cache) => Promise.allSettled(SVR_SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' })))))
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

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event?.data?.type === 'CLEAR_SVR_CACHES') {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(SVR_CACHE);
  try {
    const response = await fetch(new Request(request, { cache: 'no-store' }));
    if (response?.ok) eventSafePut(cache, request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false }) || await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('/offline.html');
    throw error;
  }
}

function eventSafePut(cache, request, response) {
  cache.put(request, response).catch(() => undefined);
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SVR_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((response) => {
      if (response?.ok) eventSafePut(cache, request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const currentReleasePath = request.mode === 'navigate'
    || url.pathname === '/'
    || /\.(?:html|js|mjs|json|webmanifest)$/i.test(url.pathname)
    || url.pathname.startsWith('/game/')
    || url.pathname.startsWith('/update/')
    || url.pathname === '/deploy-health.json';

  if (currentReleasePath) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(?:css|png|webp|svg|ico|jpg|jpeg|glb|fbx|mp3|wav)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
