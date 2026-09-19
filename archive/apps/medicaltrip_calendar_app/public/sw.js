const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `mt-calendar-${CACHE_VERSION}`;

const ASSETS = [
  './index.html',
  './manifest.json',
  './assets/css/tokens.css',
  './assets/css/calendar.css',
  './assets/css/components.css',
  './src/app.js',
  './src/domain/Money.js',
  './src/domain/OperativeTerritory.js',
  './src/domain/ItineraryEvent.js',
  './src/domain/PatientBooking.js',
  './src/domain/SettlementLedger.js',
  './src/infrastructure/DriveDatasetAdapter.js',
  './src/infrastructure/LocalFirstStorageAdapter.js',
  './src/ui/CalendarHeader.js',
  './src/ui/MonthView.js',
  './src/ui/WeekView.js',
  './src/ui/DayView.js',
  './src/ui/AgendaView.js',
  './src/ui/EventDetailDrawer.js',
  './src/ui/SettlementBalanceBar.js',
  './src/ui/ReceiptOcrModal.js',
  './src/ui/DigitalSignatureModal.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn(`[ServiceWorker]: Failed to precache ${asset}:`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key.startsWith('mt-calendar-')) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Cache-First strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          throw new Error('Offline: Network request failed');
        });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
