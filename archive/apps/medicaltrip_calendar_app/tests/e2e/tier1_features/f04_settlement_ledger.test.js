import test from 'node:test';
import assert from 'node:assert/strict';
import { SettlementLedger } from '../../../src/domain/SettlementLedger.js';
import { ItineraryEvent } from '../../../src/domain/ItineraryEvent.js';
import { Money } from '../../../src/domain/Money.js';
import { SETTLEMENT_SCENARIOS } from '../../fixtures/settlementFixtures.js';

test('F04: Settlement Ledger — Deterministic Financial Balance Math', async (t) => {
    await t.test('1. Baseline initialization with zero events returns zero expenses and advance surplus', () => {
        const advance = Money.fromUnits(1000000, 'COP');
        const ledger = new SettlementLedger('rva171', advance);
        const result = ledger.calculateFromEvents([], []);

        assert.equal(result.transportTotal.units, 0);
        assert.equal(result.guideHoursTotal, 0);
        assert.equal(result.guideHonoraryTotal.units, 0);
        assert.equal(result.outOfPocketTotal.units, 0);
        assert.equal(result.totalCuentaCobro.units, 0);
        assert.equal(result.advanceTotal.units, 1000000);
        assert.equal(result.netBalance.units, -1000000);
        assert.equal(result.isAgentPayable, false);
    });

    await t.test('2. Aggregates transport, guide honoraries, and out-of-pocket accurately', () => {
        const advance = Money.fromUnits(500000, 'COP');
        const ledger = new SettlementLedger('rva_test', advance);

        const events = [
            new ItineraryEvent({
                id: 'e1',
                patientId: 'rva_test',
                title: 'Traslado JMC',
                startDateTime: '2026-08-20T10:00:00Z',
                location: 'Aeropuerto JMC',
                costType: 'TRANSPORTE',
                costUnits: 150000
            }),
            new ItineraryEvent({
                id: 'e2',
                patientId: 'rva_test',
                title: 'Guianza CIMA',
                startDateTime: '2026-08-21T08:00:00Z',
                location: 'CIMA Diagnósticos',
                costType: 'HONORARIO_GUIA',
                hours: 4.5,
                costUnits: 69750
            }),
            new ItineraryEvent({
                id: 'e3',
                patientId: 'rva_test',
                title: 'Caja Menor Parqueadero',
                startDateTime: '2026-08-21T14:00:00Z',
                location: 'Clofán',
                costType: 'CAJA_MENOR',
                costUnits: 15000
            }),
            new ItineraryEvent({
                id: 'e4',
                patientId: 'rva_test',
                title: 'Farmacia Gotas',
                startDateTime: '2026-08-21T16:00:00Z',
                location: 'Cruz Verde',
                costType: 'FARMACIA',
                costUnits: 45000
            })
        ];

        const result = ledger.calculateFromEvents(events, []);

        assert.equal(result.transportTotal.units, 150000);
        assert.equal(result.guideHoursTotal, 4.5);
        assert.equal(result.guideHonoraryTotal.units, 69750);
        assert.equal(result.outOfPocketTotal.units, 60000); // 15k + 45k
        assert.equal(result.totalCuentaCobro.units, 279750);
        assert.equal(result.netBalance.units, -220250); // 279,750 - 500,000
        assert.equal(result.isAgentPayable, false);
    });

    await t.test('3. Incorporates dynamic extra tickets from OCR thermal receipts', () => {
        const advance = Money.fromUnits(200000, 'COP');
        const ledger = new SettlementLedger('rva_tkt', advance);

        const events = [
            new ItineraryEvent({
                id: 'e1',
                patientId: 'rva_tkt',
                title: 'Taxi',
                startDateTime: '2026-08-20T10:00:00Z',
                location: 'Medellín',
                costType: 'TRANSPORTE',
                costUnits: 30000
            })
        ];

        const extraTickets = [
            { id: 't1', amountUnits: 45000 },
            { id: 't2', amountUnits: 65000 }
        ];

        const result = ledger.calculateFromEvents(events, extraTickets);
        assert.equal(result.outOfPocketTotal.units, 110000); // 45k + 65k
        assert.equal(result.totalCuentaCobro.units, 140000); // 30k + 110k
        assert.equal(result.netBalance.units, -60000); // 140,000 - 200,000
    });

    await t.test('4. Correctly flags isAgentPayable when expenses exceed advances (Deficit scenario)', () => {
        const scenario = SETTLEMENT_SCENARIOS.OVERSPENT_DEFICIT_SCENARIO;
        const advance = Money.fromUnits(scenario.advanceUnits, 'COP');
        const ledger = new SettlementLedger(scenario.patientId, advance);

        const events = scenario.events.map((e, idx) => new ItineraryEvent({
            id: `evt-${idx}`,
            patientId: scenario.patientId,
            title: `Activity ${idx}`,
            startDateTime: '2026-08-20T10:00:00Z',
            location: 'Medellín',
            costType: e.costType,
            costUnits: e.costUnits,
            hours: e.hours || 0
        }));

        const result = ledger.calculateFromEvents(events, scenario.extraTickets);

        assert.equal(result.totalCuentaCobro.units, scenario.expected.totalCuentaCobroUnits);
        assert.equal(result.netBalance.units, scenario.expected.netBalanceUnits);
        assert.equal(result.isAgentPayable, true, 'Deficit must require payment transfer to the field agent');
    });

    await t.test('5. Standard RVA171 full fixture matches expected settlement numbers to the cent', () => {
        const scenario = SETTLEMENT_SCENARIOS.STANDARD_RVA171_FULL;
        const advance = Money.fromUnits(scenario.advanceUnits, 'COP');
        const ledger = new SettlementLedger(scenario.patientId, advance);

        const events = scenario.events.map((e, idx) => new ItineraryEvent({
            id: `evt-${idx}`,
            patientId: scenario.patientId,
            title: `Event ${idx}`,
            startDateTime: '2026-08-20T10:00:00Z',
            location: 'Medellín',
            costType: e.costType,
            costUnits: e.costUnits,
            hours: e.hours || 0
        }));

        const result = ledger.calculateFromEvents(events, scenario.extraTickets);

        assert.equal(result.transportTotal.units, scenario.expected.transportUnits);
        assert.equal(result.guideHoursTotal, scenario.expected.guideHours);
        assert.equal(result.guideHonoraryTotal.units, scenario.expected.guideHonoraryUnits);
        assert.equal(result.outOfPocketTotal.units, scenario.expected.outOfPocketUnits);
        assert.equal(result.totalCuentaCobro.units, scenario.expected.totalCuentaCobroUnits);
        assert.equal(result.netBalance.units, scenario.expected.netBalanceUnits);
        assert.equal(result.isAgentPayable, scenario.expected.isAgentPayable);
    });
});
