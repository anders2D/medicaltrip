const CACHE_NAME = 'mt-calendar-v1';
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

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
