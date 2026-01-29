// sw.js — minimal, safe (no caching to avoid stale builds)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
