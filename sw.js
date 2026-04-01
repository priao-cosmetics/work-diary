// ══════════════════════════════════════════════════════
//  SERVICE WORKER — Work Diary PWA
//  Cache Strategy: Cache-First + Version Update
// ══════════════════════════════════════════════════════

const CACHE_VERSION = 'wd-v2.3.3-2604010800';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── Install: cache ทุกไฟล์ ──
self.addEventListener('install', function(event) {
  console.log('[SW] Install:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    }).then(function() {
      // Skip waiting → activate ทันที
      return self.skipWaiting();
    })
  );
});

// ── Activate: ลบ cache เก่า ──
self.addEventListener('activate', function(event) {
  console.log('[SW] Activate:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_VERSION;
        }).map(function(key) {
          console.log('[SW] Delete old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(function() {
      // Claim all tabs ทันที
      return self.clients.claim();
    }).then(function() {
      // แจ้งทุก tab ว่ามี version ใหม่
      return self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// ── Fetch: Network-first (ถ้า online ดึงใหม่, ถ้า offline ใช้ cache) ──
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).then(function(response) {
      // Online: ดึงสำเร็จ → เก็บ cache ด้วย
      var clone = response.clone();
      caches.open(CACHE_VERSION).then(function(cache) {
        cache.put(event.request, clone);
      });
      return response;
    }).catch(function() {
      // Offline: ใช้ cache
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('Offline — ไม่มี cache สำหรับหน้านี้', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
