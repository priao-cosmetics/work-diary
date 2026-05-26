// ══════════════════════════════════════════════════
//  Work Diary V2.4.1 — Service Worker (PWA)
//  Strategy: Network-first with offline fallback
// ══════════════════════════════════════════════════
const CACHE_VERSION = 'wd-v2.4.6-1779780298';  // deploy.py replaces with timestamp
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(evt) {
  console.log('[PWA] SW wd-v2.4.6-1779780298');
  evt.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(evt) {
  console.log('[PWA] SW activate — clearing old caches');
  evt.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_VERSION; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll();
    }).then(function(clients) {
      clients.forEach(function(c) {
        c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
      });
    })
  );
});

self.addEventListener('fetch', function(evt) {
  // Network-first strategy: try network, fallback to cache
  evt.respondWith(
    fetch(evt.request).then(function(response) {
      // Cache successful responses
      if (response && response.status === 200 && evt.request.method === 'GET') {
        var clone = response.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(evt.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Network failed — use cache
      return caches.match(evt.request);
    })
  );
});
