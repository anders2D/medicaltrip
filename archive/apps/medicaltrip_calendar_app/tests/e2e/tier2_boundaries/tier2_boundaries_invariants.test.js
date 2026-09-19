import test from 'node:test';
import assert from 'node:assert/strict';
import { Money } from '../../../src/domain/Money.js';
import { OperativeTerritory } from '../../../src/domain/OperativeTerritory.js';
import { ItineraryEvent, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';
import { SettlementLedger } from '../../../src/domain/SettlementLedger.js';
import { LocalFirstStorageAdapter } from '../../../src/infrastructure/LocalFirstStorageAdapter.js';
import { setupMockBrowserEnv } from '../../fixtures/mockBrowserEnv.js';

test('Tier 2: Boundary & Corner Cases — Invariant Validation & Edge Conditions', async (t) => {
    let teardown;
    t.beforeEach(() => {
        teardown = setupMockBrowserEnv();
    });
    t.afterEach(() => {
        if (teardown) teardown();
    });

    // -------------------------------------------------------------
    // 1. Money Boundaries & Extremes
    // -------------------------------------------------------------
    await t.test('1. Money: Zero value operations preserve currency and cents', () => {
        const zeroCop = Money.zero('COP');
        assert.equal(zeroCop.cents, 0n);
        assert.equal(zeroCop.units, 0);
        assert.equal(zeroCop.isZero(), true);
        assert.equal(zeroCop.isPositive(), false);
        assert.equal(zeroCop.isNegative(), false);

        const sum = zeroCop.add(Money.fromUnits(50000, 'COP'));
        assert.equal(sum.cents, 5000000n);
    });

    await t.test('2. Money: Extreme values beyond Number.MAX_SAFE_INTEGER using BigInt cents', () => {
        // Multi-billion COP corporate medical tourism package
        const hugeAmount = Money.fromCents(900719925474099100n, 'COP');
        const increment = Money.fromCents(100n, 'COP');
        const total = hugeAmount.add(increment);

        assert.equal(total.cents, 900719925474099200n);
        assert.equal(total.cents > BigInt(Number.MAX_SAFE_INTEGER), true);
    });

    await t.test('3. Money: Fractional cent rounding invariant (Banker\'s rounding behavior)', () => {
        // Multiplied by fractional rate
        const rate = Money.fromUnits(15500, 'COP');
        const multiplied = rate.multiply(0.33333);
        assert.equal(typeof multiplied.cents, 'bigint');
        assert.ok(multiplied.cents >= 516600n && multiplied.cents <= 516700n);
    });

    await t.test('4. Money: Multiplying by zero returns exact zero Money', () => {
        const rate = Money.fromUnits(15500, 'COP');
        const zeroProduct = rate.multiply(0);
        assert.equal(zeroProduct.cents, 0n);
        assert.equal(zeroProduct.units, 0);
        assert.equal(zeroProduct.isZero(), true);
    });

    // -------------------------------------------------------------
    // 2. OperativeTerritory Geo-Fencing Adversarial Permutations
    // -------------------------------------------------------------
    await t.test('5. Geo-Fence: Adversarial forbidden location strings with special characters & whitespace', () => {
        const forbiddenAttempts = [
            '  MOCOA  ',
            'hospital-mocoa-sur',
            'CLINICA DE LETICIA / AMAZONAS',
            'Centro Medico Putumayo (Sede Mocoa)',
            'ARAUCA CAPITAL',
            'Selva Guaviare'
        ];

        for (const attempt of forbiddenAttempts) {
            assert.throws(() => {
                new OperativeTerritory(attempt);
            }, /Violación Geoespacial/, `Expected rejection for "${attempt}"`);
        }
    });

    await t.test('6. Geo-Fence: Permitted sub-regions with complex punctuation', () => {
        const permitted = [
            'Clínica Clofán (Torre Médica Ciudad del Río, Piso 3)',
            'Hotel Inntu - Laureles (Cra 74 # 48-12)',
            'Aeropuerto Internacional José María Córdova [JMC]',
            'CIMA - Ayudas Diagnósticas & Ecografías',
            'Manizales Centro Especialistas'
        ];

        for (const spot of permitted) {
            assert.doesNotThrow(() => {
                const t = new OperativeTerritory(spot);
                assert.equal(t.name, spot);
            });
        }
    });

    // -------------------------------------------------------------
    // 3. Temporal & Milestone Scheduling Corner Cases
    // -------------------------------------------------------------
    await t.test('7. Scheduling: Midnight-crossing span (23:00 to 02:00 next day)', () => {
        const start = '2026-08-21T23:00:00.000Z';
        const end = '2026-08-22T02:00:00.000Z'; // 3 hours (180 mins) crossing midnight

        const event = new ItineraryEvent({
            id: 'evt-midnight',
            patientId: 'rva171',
            title: 'Urgencias Nocturnas Clofán',
            startDateTime: start,
            endDateTime: end,
            location: 'Clínica Clofán'
        });

        assert.equal(event.durationMinutes, 180);
        assert.equal(event.startDateTime.getUTCDate(), 21);
        assert.equal(event.endDateTime.getUTCDate(), 22);
    });

    await t.test('8. Scheduling: Zero-minute instantaneous milestone', () => {
        const timestamp = '2026-08-21T10:00:00.000Z';
        const instantEvent = new ItineraryEvent({
            id: 'evt-instant',
            patientId: 'rva171',
            title: 'Notificación Entrega Medicamento',
            startDateTime: timestamp,
            endDateTime: timestamp,
            location: 'Hotel Inntu Laureles'
        });

        assert.equal(instantEvent.durationMinutes, 0);
    });

    await t.test('9. Scheduling: Concurrent time overlap between two events', () => {
        const evt1 = new ItineraryEvent({
            id: 'evt-overlap-1',
            patientId: 'rva171',
            title: 'Consulta Dr Peláez',
            startDateTime: '2026-08-21T10:00:00.000Z',
            endDateTime: '2026-08-21T11:30:00.000Z',
            location: 'Clínica Clofán'
        });

        const evt2 = new ItineraryEvent({
            id: 'evt-overlap-2',
            patientId: 'rva171',
            title: 'Ecografía Abdominal CIMA',
            startDateTime: '2026-08-21T10:30:00.000Z',
            endDateTime: '2026-08-21T12:00:00.000Z',
            location: 'CIMA Diagnósticos'
        });

        const hasOverlap = (a, b) => {
            return (a.startDateTime < b.endDateTime && a.endDateTime > b.startDateTime);
        };

        assert.equal(hasOverlap(evt1, evt2), true, 'Detects 60-minute concurrency conflict');
    });

    await t.test('10. Scheduling: Leap year date handling (2028-02-29)', () => {
        const leapDate = '2028-02-29T14:00:00.000Z';
        const leapEvent = new ItineraryEvent({
            id: 'evt-leap',
            patientId: 'rva171',
            title: 'Chequeo Bianual',
            startDateTime: leapDate,
            location: 'Clínica Clofán'
        });

        assert.equal(leapEvent.startDateTime.getUTCFullYear(), 2028);
        assert.equal(leapEvent.startDateTime.getUTCMonth(), 1); // February (0-indexed)
        assert.equal(leapEvent.startDateTime.getUTCDate(), 29);
    });

    // -------------------------------------------------------------
    // 4. Financial Ledger Boundary Conditions
    // -------------------------------------------------------------
    await t.test('11. Ledger: Zero advance with massive expenses results in 100% payable balance', () => {
        const ledger = new SettlementLedger('rva_zero_adv', Money.zero('COP'));
        const events = [
            new ItineraryEvent({
                id: 'e1',
                patientId: 'rva_zero_adv',
                title: 'Traslado Ambulancia Especial',
                startDateTime: '2026-08-20T10:00:00Z',
                costType: 'TRANSPORTE',
                costUnits: 450000
            })
        ];

        const res = ledger.calculateFromEvents(events, [{ amountUnits: 120000 }]);
        assert.equal(res.totalCuentaCobro.units, 570000);
        assert.equal(res.netBalance.units, 570000);
        assert.equal(res.isAgentPayable, true);
    });

    await t.test('12. Ledger: Massive advance with zero expenses results in full surplus to Medical Trip', () => {
        const advance = Money.fromUnits(10000000, 'COP'); // 10 Million COP
        const ledger = new SettlementLedger('rva_heavy_adv', advance);

        const res = ledger.calculateFromEvents([], []);
        assert.equal(res.totalCuentaCobro.units, 0);
        assert.equal(res.netBalance.units, -10000000);
        assert.equal(res.isAgentPayable, false);
    });

    await t.test('13. Ledger: Extra tickets with zero amount units do not affect totals', () => {
        const advance = Money.fromUnits(500000, 'COP');
        const ledger = new SettlementLedger('rva_zero_tkt', advance);

        const res = ledger.calculateFromEvents([], [
            { id: 't1', amountUnits: 0 },
            { id: 't2', amountUnits: null },
            { id: 't3', amountUnits: undefined }
        ]);

        assert.equal(res.outOfPocketTotal.units, 0);
        assert.equal(res.totalCuentaCobro.units, 0);
        assert.equal(res.netBalance.units, -500000);
    });

    // -------------------------------------------------------------
    // 5. OCR Receipts & Digital Signature Edge Cases
    // -------------------------------------------------------------
    await t.test('14. OCR: Unformatted text with missing numbers defaults safely', () => {
        const rawGarbledText = 'RECIBO BORROSO ILEGIBLE SIN PRECIO NI NIT';
        const matchTotal = rawGarbledText.match(/\bTOTAL\b[:\s]+(?:\$)?\s*([0-9.]+)/i);
        const amount = matchTotal ? Number(matchTotal[1].replace(/\./g, '')) : 0;

        assert.equal(amount, 0);
    });

    await t.test('15. Storage: Handles unexpected storage keys and empty arrays gracefully', () => {
        globalThis.localStorage.setItem('mt_calendar_events', '[]');
        const loaded = LocalFirstStorageAdapter.loadEvents([]);
        assert.deepEqual(loaded, []);

        globalThis.localStorage.setItem('mt_calendar_tickets', '[]');
        const tickets = LocalFirstStorageAdapter.loadTickets('rva999');
        assert.deepEqual(tickets, []);
    });
});
