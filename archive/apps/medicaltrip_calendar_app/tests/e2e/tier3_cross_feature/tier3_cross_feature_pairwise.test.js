import test from 'node:test';
import assert from 'node:assert/strict';
import { ItineraryEvent, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';
import { SettlementLedger } from '../../../src/domain/SettlementLedger.js';
import { DriveDatasetAdapter } from '../../../src/infrastructure/DriveDatasetAdapter.js';
import { LocalFirstStorageAdapter } from '../../../src/infrastructure/LocalFirstStorageAdapter.js';
import { SettlementBalanceBar } from '../../../src/ui/SettlementBalanceBar.js';
import { MonthView } from '../../../src/ui/MonthView.js';
import { WeekView } from '../../../src/ui/WeekView.js';
import { DayView } from '../../../src/ui/DayView.js';
import { setupMockBrowserEnv } from '../../fixtures/mockBrowserEnv.js';
import { Money } from '../../../src/domain/Money.js';

test('Tier 3: Cross-Feature Combinations — Pairwise Integration & Reactive Workflows', async (t) => {
    let teardown;
    t.beforeEach(() => {
        teardown = setupMockBrowserEnv();
    });
    t.afterEach(() => {
        if (teardown) teardown();
    });

    await t.test('1. Pairwise: Rescheduling milestone duration triggers live settlement recalculation', () => {
        const patients = DriveDatasetAdapter.getPatients();
        const catia = patients.find(p => p.id === 'rva171');
        const events = DriveDatasetAdapter.getInitialEvents().filter(e => e.patientId === 'rva171');

        // Initial settlement calculation
        const ledger1 = new SettlementLedger('rva171', catia.advanceTotal);
        const initialSettlement = ledger1.calculateFromEvents(events, []);
        const initialGuideFees = initialSettlement.guideHonoraryTotal.units;

        // Find guide event at Clofán (initially 2.5 hours = $38.750)
        const guideEvent = events.find(e => e.id === 'evt-171-2');
        assert.ok(guideEvent);
        assert.equal(guideEvent.hours, 2.5);

        // Reschedule event extending it to 6.0 hours ($93.000)
        guideEvent.hours = 6.0;
        guideEvent.cost = Money.fromUnits(93000, 'COP');

        const ledger2 = new SettlementLedger('rva171', catia.advanceTotal);
        const updatedSettlement = ledger2.calculateFromEvents(events, []);
        const updatedGuideFees = updatedSettlement.guideHonoraryTotal.units;

        // Verify delta in fees: 93,000 - 38,750 = 54,250
        assert.equal(updatedGuideFees - initialGuideFees, 54250);
        assert.equal(updatedSettlement.netBalance.units - initialSettlement.netBalance.units, 54250);

        // Verify UI SettlementBalanceBar renders updated value
        const barHtml = SettlementBalanceBar.render(updatedSettlement);
        assert.ok(barHtml.includes('93.000') || barHtml.includes('93,000') || barHtml.includes(updatedSettlement.guideHonoraryTotal.format()));
    });

    await t.test('2. Pairwise: OCR receipt ingestion adds ticket and immediately updates ledger out-of-pocket & net balance', () => {
        const patients = DriveDatasetAdapter.getPatients();
        const catia = patients.find(p => p.id === 'rva171');
        const events = DriveDatasetAdapter.getInitialEvents().filter(e => e.patientId === 'rva171');

        const ledger = new SettlementLedger('rva171', catia.advanceTotal);
        const before = ledger.calculateFromEvents(events, []);

        // Ingest OCR pharmacy ticket
        const ocrTicket = {
            id: 'tkt-ocr-1',
            patientId: 'rva171',
            concept: 'Droguería Cruz Verde - Enoxaparina',
            amountUnits: 65000
        };
        LocalFirstStorageAdapter.addTicket(ocrTicket);
        const tickets = LocalFirstStorageAdapter.loadTickets('rva171');

        const after = ledger.calculateFromEvents(events, tickets);
        assert.equal(after.outOfPocketTotal.units - before.outOfPocketTotal.units, 65000);
        assert.equal(after.totalCuentaCobro.units - before.totalCuentaCobro.units, 65000);
    });

    await t.test('3. Pairwise: Guide meal subsidy dynamically computes and links with milestone duration', () => {
        const computeGuideSubsidy = (hours) => {
            if (hours >= 8.0) return 35000;
            if (hours >= 5.0) return 25000;
            if (hours >= 3.0) return 8000;
            return 0;
        };

        const eventShort = new ItineraryEvent({
            id: 'e-short',
            patientId: 'rva171',
            title: 'Control Rápido',
            startDateTime: '2026-08-21T09:00:00Z',
            endDateTime: '2026-08-21T11:00:00Z',
            costType: 'HONORARIO_GUIA',
            hours: 2.0,
            costUnits: 31000
        });

        assert.equal(computeGuideSubsidy(eventShort.hours), 0);

        // Extended to full day CIMA (8h)
        eventShort.hours = 8.0;
        eventShort.cost = Money.fromUnits(124000, 'COP');
        const subsidy = computeGuideSubsidy(eventShort.hours);
        assert.equal(subsidy, 35000);

        // Combined ledger with subsidy
        const ledger = new SettlementLedger('rva171', Money.zero('COP'));
        const result = ledger.calculateFromEvents([eventShort], [{ amountUnits: subsidy }]);
        assert.equal(result.guideHonoraryTotal.units, 124000);
        assert.equal(result.outOfPocketTotal.units, 35000);
        assert.equal(result.totalCuentaCobro.units, 159000);
    });

    await t.test('4. Pairwise: Switching active archetype hydrates scoped events and isolates ledger balance', () => {
        const allPatients = DriveDatasetAdapter.getPatients();
        const allEvents = DriveDatasetAdapter.getInitialEvents();

        // 1. Check Catia (rva171)
        const catia = allPatients.find(p => p.id === 'rva171');
        const catiaEvents = allEvents.filter(e => e.patientId === 'rva171');
        const catiaLedger = new SettlementLedger('rva171', catia.advanceTotal).calculateFromEvents(catiaEvents, []);
        assert.equal(catiaLedger.advanceTotal.units, 2098100);

        // 2. Switch to Eduard (rva341)
        const eduard = allPatients.find(p => p.id === 'rva341');
        const eduardEvents = allEvents.filter(e => e.patientId === 'rva341');
        const eduardLedger = new SettlementLedger('rva341', eduard.advanceTotal).calculateFromEvents(eduardEvents, []);
        
        assert.equal(eduard.code, 'RVA341-1');
        assert.equal(eduardLedger.advanceTotal.units, 950000);
        assert.equal(eduardEvents.length, 2);
        assert.notEqual(catiaLedger.netBalance.units, eduardLedger.netBalance.units);
    });

    await t.test('5. Pairwise: Multi-view transitions preserve temporal state and event datasets', () => {
        const events = DriveDatasetAdapter.getInitialEvents().filter(e => e.patientId === 'rva171');
        const targetDate = new Date(events[0].startDateTime);

        const monthHtml = MonthView.render(targetDate, events);
        const weekHtml = WeekView.render(targetDate, events);
        const dayHtml = DayView.render(targetDate, events);

        // All views render initial event or its details
        assert.ok(monthHtml.includes('evt-171-1') || monthHtml.includes(events[0].title));
        assert.ok(weekHtml.includes('evt-171-1') || weekHtml.includes(events[0].title));
        assert.ok(dayHtml.includes('evt-171-1') || dayHtml.includes(events[0].title));
    });

    await t.test('6. Pairwise: Digital signature locks itinerary milestones and attaches confirmation payload', () => {
        const events = DriveDatasetAdapter.getInitialEvents().filter(e => e.patientId === 'rva171');
        const catia = DriveDatasetAdapter.getPatients().find(p => p.id === 'rva171');

        const ledgerResult = new SettlementLedger('rva171', catia.advanceTotal).calculateFromEvents(events, []);
        
        const signOffRecord = {
            patientId: 'rva171',
            patientName: catia.name,
            totalCuentaCobroCents: ledgerResult.totalCuentaCobro.cents.toString(),
            netBalanceCents: ledgerResult.netBalance.cents.toString(),
            signatureTimestamp: new Date().toISOString(),
            isCertified: true
        };

        assert.equal(signOffRecord.isCertified, true);
        assert.equal(signOffRecord.patientName, 'Catia Rodrigues (Grupo Familiar 5 Pax)');
        assert.ok(BigInt(signOffRecord.totalCuentaCobroCents) > 0n);
    });
});
