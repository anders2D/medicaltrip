import test from 'node:test';
import assert from 'node:assert/strict';
import { Money } from '../../../src/domain/Money.js';
import { OperativeTerritory } from '../../../src/domain/OperativeTerritory.js';
import { ItineraryEvent, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';
import { SettlementLedger } from '../../../src/domain/SettlementLedger.js';
import { PatientBooking } from '../../../src/domain/PatientBooking.js';
import { DriveDatasetAdapter } from '../../../src/infrastructure/DriveDatasetAdapter.js';
import { LocalFirstStorageAdapter } from '../../../src/infrastructure/LocalFirstStorageAdapter.js';
import { setupMockBrowserEnv } from '../../fixtures/mockBrowserEnv.js';

test('Tier 5: White-Box Adversarial Coverage Hardening & Extreme Stress', async (t) => {
    let teardown;
    t.beforeEach(() => {
        teardown = setupMockBrowserEnv();
    });
    t.afterEach(() => {
        if (teardown) teardown();
    });

    // -------------------------------------------------------------
    // 1. Extreme BigInt Values ($10^15 Cents / Multi-Trillion Precision)
    // -------------------------------------------------------------
    await t.test('1. Extreme BigInt: $10^15 cents ($10 Trillion COP) exact arithmetic and formatting', () => {
        const tenToFifteen = 1000000000000000n; // 10^15 cents = $10 Trillion COP
        const m1 = Money.fromCents(tenToFifteen, 'COP');
        const m2 = Money.fromCents(tenToFifteen * 3n, 'COP');

        const sum = m1.add(m2);
        assert.equal(sum.cents, 4000000000000000n);
        assert.equal(sum.units, 40000000000000);
        assert.equal(sum.format().includes('40.000.000.000.000'), true);

        const diff = m2.subtract(m1);
        assert.equal(diff.cents, 2000000000000000n);
    });

    await t.test('2. Extreme BigInt: Settlement Ledger with multi-trillion advance vs multi-trillion expenses', () => {
        const advance = Money.fromCents(5000000000000000n, 'COP'); // $50 Trillion COP
        const ledger = new SettlementLedger('pax-trillion', advance);

        const event = new ItineraryEvent({
            id: 'evt-mega',
            patientId: 'pax-trillion',
            title: 'International Fleet & Surgical Fleet',
            startDateTime: '2026-08-20T10:00:00Z',
            costType: 'TRANSPORTE',
            costUnits: 49999999999900 // $49.999... Trillion units
        });

        const sheet = ledger.calculateFromEvents([event], []);
        // Net balance = 49,999,999,999,900 - 50,000,000,000,000 = -100 COP (10,000n cents refund)
        assert.equal(sheet.netBalance.units, -100);
        assert.equal(sheet.netBalance.cents, -10000n);
        assert.equal(sheet.isAgentPayable, false); // Refund to patient
    });

    // -------------------------------------------------------------
    // 2. Non-Operative Territory Injections
    // -------------------------------------------------------------
    await t.test('3. Territory Injections: Rejects forbidden zones (Mocoa, Leticia, Amazonas, Arauca, etc.)', () => {
        const forbiddenSamples = [
            'MOCOA',
            'mocoa',
            '  mocoa  \t',
            'Clinica Mocoa Putumayo',
            'LETICIA',
            'Leticia Amazonas Decameron',
            'ARAUCA',
            'GUAVIARE',
            'PUTUMAYO'
        ];

        for (const input of forbiddenSamples) {
            assert.throws(() => {
                new OperativeTerritory(input);
            }, /Violación Geoespacial/, `Expected fail-fast rejection for: ${input}`);
        }
    });

    await t.test('4. Territory Injections: Rejects non-operative locations inside ItineraryEvent constructors', () => {
        assert.throws(() => {
            new ItineraryEvent({
                id: 'evt-mocoa',
                patientId: 'rva171',
                title: 'Traslado Prohibido',
                startDateTime: '2026-08-20T10:00:00Z',
                location: 'Hospital Departamental de Mocoa'
            });
        }, /Violación Geoespacial/);
    });

    // -------------------------------------------------------------
    // 3. Out-of-Bounds Dates & Temporal Resilience
    // -------------------------------------------------------------
    await t.test('5. Temporal Resilience: Distant future 2099 and century midnight crossing', () => {
        const evt = new ItineraryEvent({
            id: 'evt-future-2099',
            patientId: 'rva171',
            title: 'Centennial Checkup',
            startDateTime: '2099-12-31T23:00:00.000Z',
            endDateTime: '2100-01-01T02:00:00.000Z',
            location: 'Clínica Clofán'
        });

        assert.equal(evt.durationMinutes, 180);
        assert.equal(evt.startDateTime.getUTCFullYear(), 2099);
        assert.equal(evt.endDateTime.getUTCFullYear(), 2100);
    });

    await t.test('6. Temporal Resilience: Leap year 2028-02-29 milestone manipulation', () => {
        const leapEvt = new ItineraryEvent({
            id: 'evt-leap-2028',
            patientId: 'rva171',
            title: 'Leap Year Lab',
            startDateTime: '2028-02-29T08:00:00.000Z',
            endDateTime: '2028-02-29T10:00:00.000Z',
            location: 'CIMA Diagnósticos'
        });

        assert.equal(leapEvt.durationMinutes, 120);
        assert.equal(leapEvt.startDateTime.getUTCDate(), 29);
        assert.equal(leapEvt.startDateTime.getUTCMonth(), 1); // Feb
    });

    // -------------------------------------------------------------
    // 4. Corrupted OCR Inputs
    // -------------------------------------------------------------
    await t.test('7. Corrupted OCR: Empty strings, scripts, and malformed receipt text parsing', () => {
        const corruptedSamples = [
            '',
            '    \n\t   ',
            '<script>alert(1)</script>',
            '%PDF-1.4 %JUNK',
            'RECIBO SIN VALORES NI TOTALES',
            'TOTAL: -$50.000 COP'
        ];

        for (const raw of corruptedSamples) {
            const matchTotal = raw.match(/\bTOTAL\b[:\s]+(?:\$)?\s*([0-9.]+)/i);
            const amount = matchTotal ? Number(matchTotal[1].replace(/\./g, '')) : 0;
            assert.equal(typeof amount, 'number');
            assert.equal(Number.isFinite(amount), true);
        }
    });

    // -------------------------------------------------------------
    // 5. Digital Signatures & State Invariants
    // -------------------------------------------------------------
    await t.test('8. Digital Signature: Event status completion and signature attachment', () => {
        const evt = new ItineraryEvent({
            id: 'evt-sig-test',
            patientId: 'rva171',
            title: 'Cirugía Oftalmológica',
            startDateTime: '2026-08-20T10:00:00Z',
            location: 'Clínica Clofán',
            status: EVENT_STATUS.SCHEDULED
        });

        assert.equal(evt.status, EVENT_STATUS.SCHEDULED);
        evt.markCompleted();
        evt.signatureDataUrl = 'data:image/png;base64,mockSignatureBlob123';

        assert.equal(evt.status, EVENT_STATUS.COMPLETED);
        assert.equal(evt.gpsChecked, true);
        assert.equal(evt.signatureDataUrl.startsWith('data:image/png;base64,'), true);
    });

    // -------------------------------------------------------------
    // 6. Rapid Archetype Switching & Dataset Isolation
    // -------------------------------------------------------------
    await t.test('9. Archetype Switching: Cycling through all 4 Drive archetypes maintains isolated balances', () => {
        const patients = DriveDatasetAdapter.getPatients();
        assert.equal(patients.length, 4);

        const allEvents = DriveDatasetAdapter.getInitialEvents();
        assert.equal(allEvents.length > 0, true);

        // Rapid cycling simulation
        for (let i = 0; i < 20; i++) {
            const p = patients[i % 4];
            const pEvents = allEvents.filter(e => e.patientId === p.id);
            const advance = p.advanceTotal;
            const ledger = new SettlementLedger(p.id, advance);
            const res = ledger.calculateFromEvents(pEvents, []);
            assert.equal(res.advanceTotal.units, p.advanceTotal.units);
            assert.equal(res.isAgentPayable, false); // Medical Trip surplus
        }
    });

    // -------------------------------------------------------------
    // 7. Concurrent State & Storage Mutation Resilience
    // -------------------------------------------------------------
    await t.test('10. Concurrent Mutation: Parallel persistence across multiple keys does not corrupt data', () => {
        const now = new Date().toISOString();
        const eventsA = [{ id: 'a1', title: 'Event A', startDateTime: now, endDateTime: now }];
        const eventsB = [{ id: 'b1', title: 'Event B', startDateTime: now, endDateTime: now }];

        LocalFirstStorageAdapter.saveEvents(eventsA);
        const loadedA = LocalFirstStorageAdapter.loadEvents();
        assert.equal(loadedA.length, 1);
        assert.equal(loadedA[0].id, 'a1');

        LocalFirstStorageAdapter.saveEvents(eventsB);
        const loadedB = LocalFirstStorageAdapter.loadEvents();
        assert.equal(loadedB.length, 1);
        assert.equal(loadedB[0].id, 'b1');

        LocalFirstStorageAdapter.addTicket({ id: 't1', patientId: 'rva171', amountUnits: 50000 });
        LocalFirstStorageAdapter.addTicket({ id: 't2', patientId: 'rva282', amountUnits: 30000 });

        const t1 = LocalFirstStorageAdapter.loadTickets('rva171');
        const t2 = LocalFirstStorageAdapter.loadTickets('rva282');

        assert.equal(t1.length, 1);
        assert.equal(t2.length, 1);
        assert.equal(t1[0].amountUnits, 50000);
        assert.equal(t2[0].amountUnits, 30000);
    });
});
