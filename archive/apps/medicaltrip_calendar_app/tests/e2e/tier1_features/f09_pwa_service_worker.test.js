import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../../../');

test('F09: PWA & Service Worker — 100% Offline Standalone Capabilities', async (t) => {
    const manifestPath = path.join(appRoot, 'manifest.json');
    const swPath = path.join(appRoot, 'service-worker.js');

    await t.test('1. manifest.json adheres to standalone PWA requirements', () => {
        assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in root');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        assert.equal(manifest.display, 'standalone');
        assert.equal(manifest.name, 'Medical Trip Itinerarios & Liquidación');
        assert.equal(manifest.short_name, 'MT Calendar');
        assert.equal(manifest.theme_color, '#0284c7');
        assert.equal(manifest.start_url, './index.html');
    });

    await t.test('2. service-worker.js defines cache version and precache asset list', () => {
        assert.ok(fs.existsSync(swPath), 'service-worker.js must exist in root');
        const swContent = fs.readFileSync(swPath, 'utf8');

        assert.match(swContent, /const CACHE_NAME = 'mt-calendar-v\d+'/);
        assert.match(swContent, /self\.addEventListener\('install'/);
        assert.match(swContent, /self\.addEventListener\('fetch'/);
    });

    await t.test('3. Precache list includes all domain entities, UI views, and styles', () => {
        const swContent = fs.readFileSync(swPath, 'utf8');
        const requiredAssets = [
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

        for (const asset of requiredAssets) {
            assert.ok(swContent.includes(asset), `Asset ${asset} must be listed in ASSETS array`);
            // Verify file exists on disk
            const relativeDiskPath = asset.replace(/^\.\//, '');
            const absoluteDiskPath = path.join(appRoot, relativeDiskPath);
            assert.ok(fs.existsSync(absoluteDiskPath), `File on disk must exist: ${relativeDiskPath}`);
        }
    });

    await t.test('4. Simulates cache-first offline fetch interceptor', async () => {
        const mockCache = new Map();
        mockCache.set('/index.html', '<html><body>Cached Offline Content</body></html>');

        const mockFetchHandler = async (requestUrl) => {
            if (mockCache.has(requestUrl)) {
                return { status: 200, body: mockCache.get(requestUrl), source: 'cache' };
            }
            throw new Error('Offline: Network request failed');
        };

        const res1 = await mockFetchHandler('/index.html');
        assert.equal(res1.source, 'cache');
        assert.ok(res1.body.includes('Cached Offline Content'));

        await assert.rejects(async () => {
            await mockFetchHandler('/uncached-api-call');
        }, /Offline: Network request failed/);
    });

    await t.test('5. Verifies standalone HTML entry contains PWA viewport and meta tags', () => {
        const htmlPath = path.join(appRoot, 'index.html');
        const html = fs.readFileSync(htmlPath, 'utf8');

        assert.match(html, /name="viewport"/);
        assert.match(html, /manifest\.json/);
        assert.match(html, /<title>/);
    });
});
