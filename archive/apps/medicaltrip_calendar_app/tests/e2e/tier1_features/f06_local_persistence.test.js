import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalFirstStorageAdapter } from '../../../src/infrastructure/LocalFirstStorageAdapter.js';
import { setupMockBrowserEnv } from '../../fixtures/mockBrowserEnv.js';

test('F06: Local-First Persistence — LocalStorage / IndexedDB Storage Adapter', async (t) => {
    let teardown;
    t.beforeEach(() => {
        teardown = setupMockBrowserEnv();
    });
    t.afterEach(() => {
        if (teardown) teardown();
    });

    await t.test('1. init() invokes navigator.storage.persist() for WebKit anti-eviction', async () => {
        let persistCalled = false;
        globalThis.navigator.storage.persist = async () => {
            persistCalled = true;
            return true;
        };

        await LocalFirstStorageAdapter.init();
        assert.equal(persistCalled, true);
    });

    await t.test('2. loadEvents() returns default events when storage is empty and persists them', () => {
        const defaults = [
            { id: 'evt-1', patientId: 'rva171', title: 'Default Event', startDateTime: new Date(), endDateTime: new Date() }
        ];

        const loaded = LocalFirstStorageAdapter.loadEvents(defaults);
        assert.equal(loaded.length, 1);
        assert.equal(loaded[0].id, 'evt-1');

        // Check it was saved to localStorage
        const stored = JSON.parse(globalThis.localStorage.getItem('mt_calendar_events'));
        assert.equal(stored.length, 1);
    });

    await t.test('3. saveEvents() and loadEvents() round-trips date objects correctly', () => {
        const testEvents = [
            {
                id: 'evt-roundtrip',
                patientId: 'rva282',
                title: 'Roundtrip Test',
                startDateTime: new Date('2026-08-25T14:30:00.000Z'),
                endDateTime: new Date('2026-08-25T16:00:00.000Z')
            }
        ];

        LocalFirstStorageAdapter.saveEvents(testEvents);
        const loaded = LocalFirstStorageAdapter.loadEvents([]);

        assert.equal(loaded.length, 1);
        assert.equal(loaded[0].id, 'evt-roundtrip');
        assert.ok(loaded[0].startDateTime instanceof Date);
        assert.equal(loaded[0].startDateTime.toISOString(), '2026-08-25T14:30:00.000Z');
    });

    await t.test('4. addTicket() and loadTickets() handles patient-scoped expense receipts', () => {
        LocalFirstStorageAdapter.addTicket({
            id: 'tkt-1',
            patientId: 'rva171',
            concept: 'Droguería Cruz Verde Gotas',
            amountUnits: 85000
        });

        LocalFirstStorageAdapter.addTicket({
            id: 'tkt-2',
            patientId: 'rva282',
            concept: 'Anticoagulante Cardio VID',
            amountUnits: 35000
        });

        const catiaTickets = LocalFirstStorageAdapter.loadTickets('rva171');
        assert.equal(catiaTickets.length, 1);
        assert.equal(catiaTickets[0].concept, 'Droguería Cruz Verde Gotas');

        const georgeTickets = LocalFirstStorageAdapter.loadTickets('rva282');
        assert.equal(georgeTickets.length, 1);
        assert.equal(georgeTickets[0].amountUnits, 35000);

        const allTickets = LocalFirstStorageAdapter.loadTickets(null);
        assert.equal(allTickets.length, 2);
    });

    await t.test('5. Recovers gracefully from corrupted JSON data in storage', () => {
        globalThis.localStorage.setItem('mt_calendar_events', '{corrupt-json-syntax');
        const fallbackDefaults = [{ id: 'evt-fallback', title: 'Fallback' }];

        const loaded = LocalFirstStorageAdapter.loadEvents(fallbackDefaults);
        assert.equal(loaded.length, 1);
        assert.equal(loaded[0].id, 'evt-fallback');

        globalThis.localStorage.setItem('mt_calendar_tickets', 'invalid-tickets-json');
        const tickets = LocalFirstStorageAdapter.loadTickets('rva171');
        assert.deepEqual(tickets, []);
    });
});
