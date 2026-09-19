import test from 'node:test';
import assert from 'node:assert/strict';
import { ItineraryEvent, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';
import { SettlementLedger } from '../../../src/domain/SettlementLedger.js';
import { DriveDatasetAdapter } from '../../../src/infrastructure/DriveDatasetAdapter.js';
import { Money } from '../../../src/domain/Money.js';

test('F05: Application Use Cases — Event Scheduling, Rescheduling, and Settlement Flows', async (t) => {
    const patients = DriveDatasetAdapter.getPatients();
    const catia = patients.find(p => p.id === 'rva171');
    let events = DriveDatasetAdapter.getInitialEvents().filter(e => e.patientId === 'rva171');

    await t.test('1. ScheduleEvent Use Case adds a new medical milestone', () => {
        const initialCount = events.length;
        const newEvt = new ItineraryEvent({
            id: 'evt-new-1',
            patientId: 'rva171',
            title: 'Control Postoperatorio Clofán',
            category: 'CLINICAL_CONSULTATION',
            startDateTime: '2026-08-22T10:00:00Z',
            endDateTime: '2026-08-22T11:00:00Z',
            location: 'Clínica Clofán Ciudad del Río',
            costType: 'HONORARIO_GUIA',
            hours: 1.0,
            costUnits: 15500
        });

        events.push(newEvt);
        assert.equal(events.length, initialCount + 1);
        assert.equal(events.find(e => e.id === 'evt-new-1')?.title, 'Control Postoperatorio Clofán');
    });

    await t.test('2. ScheduleEvent Use Case rejects event in forbidden territory', () => {
        assert.throws(() => {
            new ItineraryEvent({
                id: 'evt-bad-geo',
                patientId: 'rva171',
                title: 'Excursión Mocoa',
                startDateTime: '2026-08-22T10:00:00Z',
                location: 'Hospital Mocoa'
            });
        }, /Violación Geoespacial/);
    });

    await t.test('3. RescheduleMilestone Use Case updates time and keeps domain consistency', () => {
        const target = events.find(e => e.id === 'evt-new-1');
        assert.ok(target);
        
        target.reschedule('2026-08-22T15:30:00Z');
        assert.equal(target.startDateTime.toISOString(), '2026-08-22T15:30:00.000Z');
        assert.equal(target.endDateTime.toISOString(), '2026-08-22T16:30:00.000Z');
    });

    await t.test('4. DeleteMilestone Use Case removes event and reduces ledger total', () => {
        const ledgerBefore = new SettlementLedger('rva171', catia.advanceTotal).calculateFromEvents(events, []);
        const totalBefore = ledgerBefore.totalCuentaCobro.units;

        events = events.filter(e => e.id !== 'evt-new-1');
        const ledgerAfter = new SettlementLedger('rva171', catia.advanceTotal).calculateFromEvents(events, []);
        const totalAfter = ledgerAfter.totalCuentaCobro.units;

        assert.equal(totalBefore - totalAfter, 15500);
    });

    await t.test('5. SettleItinerary Use Case computes exact balance and agent payout status', () => {
        const ledger = new SettlementLedger('rva171', catia.advanceTotal);
        const settlement = ledger.calculateFromEvents(events, [{ amountUnits: 65000 }]);

        assert.ok(settlement.totalCuentaCobro.units > 0);
        assert.equal(settlement.advanceTotal.units, 2098100);
        assert.equal(settlement.netBalance.units, settlement.totalCuentaCobro.units - 2098100);
    });

    await t.test('6. SwitchArchetype Use Case switches active patient and recalculates scoped ledger', () => {
        const george = patients.find(p => p.id === 'rva282');
        assert.ok(george);

        const georgeEvents = DriveDatasetAdapter.getInitialEvents().filter(e => e.patientId === 'rva282');
        const georgeLedger = new SettlementLedger('rva282', george.advanceTotal);
        const result = georgeLedger.calculateFromEvents(georgeEvents, []);

        assert.equal(result.transportTotal.units, 145000);
        assert.equal(result.guideHonoraryTotal.units, 46500);
        assert.equal(result.advanceTotal.units, 1200000);
        assert.equal(result.netBalance.units, -1008500);
    });
});
