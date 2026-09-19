/**
 * Service Worker: 100% Offline App Shell & Cache-First Strategy.
 * Medical Trip Colombia S.A.S. — Field Operations & Financial Settlement PWA.
 */

const CACHE_VERSION = 'medicaltrip-offline-v1.0.0';
const CACHE_NAME = `medicaltrip-shell-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/variables.css',
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/timeline.css',
  './assets/css/balance-bar.css',
  './assets/css/modals.css',
  './src/domain/index.js',
  './src/domain/errors/domain-error.js',
  './src/domain/value-objects/money.js',
  './src/domain/value-objects/operative-territory.js',
  './src/domain/value-objects/location-coordinate.js',
  './src/domain/value-objects/actor-event.js',
  './src/domain/entities/itinerary-item.js',
  './src/domain/entities/expense-item.js',
  './src/domain/entities/companion-shift.js',
  './src/domain/entities/driver-transfer.js',
  './src/domain/entities/patient-signature.js',
  './src/domain/entities/settlement-ledger.js',
  './src/domain/ports/storage-port.js',
  './src/domain/ports/blob-storage-port.js',
  './src/domain/ports/actor-event-bus-port.js',
  './src/domain/ports/geolocation-port.js',
  './src/domain/ports/ocr-port.js',
  './src/infrastructure/index.js',
  './src/infrastructure/storage/sqlite-storage-adapter.js',
  './src/infrastructure/storage/dexie-blob-storage-adapter.js',
  './src/infrastructure/storage/storage-persistence-manager.js',
  './src/infrastructure/hardware/simulated-geolocation-adapter.js',
  './src/infrastructure/hardware/canvas-signature-adapter.js',
  './src/infrastructure/hardware/mock-ocr-adapter.js',
  './src/infrastructure/data/archetypes-data.js'
];

// Install Event: Pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        // Cache assets gracefully (ignore failures for optional icon assets)
        for (const asset of PRECACHE_ASSETS) {
          try {
            await cache.add(asset);
          } catch {
            // Silently skip missing optional assets in test environments
          }
        }
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First strategy with network fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Bypass non-HTTP/HTTPS schemes (e.g. chrome-extension, blob, data)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from network, cache dynamically for offline usage
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for HTML navigation requests
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
          return new Response('Offline: Recurso no disponible en caché.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
    })
  );
});
