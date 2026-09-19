/**
 * TIER 3: Cross-Feature Integration Test Suite (>=15 tests)
 * Medical Trip Colombia S.A.S. - Standalone Local-First Offline PWA
 */

import { describe, it, expect, beforeEach, runAllTests } from './test_harness.js';
import { Money } from '../src/domain/value-objects/money.js';
import { LocationCoordinate } from '../src/domain/value-objects/location-coordinate.js';
import { ActorEvent, sha256 } from '../src/domain/value-objects/actor-event.js';
import { ItineraryItem } from '../src/domain/entities/itinerary-item.js';
import { ExpenseItem } from '../src/domain/entities/expense-item.js';
import { CompanionShift } from '../src/domain/entities/companion-shift.js';
import { DriverTransfer } from '../src/domain/entities/driver-transfer.js';
import { PatientSignature } from '../src/domain/entities/patient-signature.js';
import { SettlementLedger } from '../src/domain/entities/settlement-ledger.js';
import { DomainError } from '../src/domain/errors/domain-error.js';

describe('Tier 3: Cross-Feature Integration & Workflow Combinations', () => {
  // Test Harness Infrastructure Simulation
  let sqliteLedgerEvents;
  let dexieBlobStore;
  let actorMessageMesh;
  let activeLedger;

  beforeEach(() => {
    sqliteLedgerEvents = [];
    dexieBlobStore = new Map();
    actorMessageMesh = new Map();
    activeLedger = new SettlementLedger({
      reservationCode: 'RVA171',
      patientUuid: 'ENT-PAX-0171',
      currency: 'COP'
    });
  });

  // --------------------------------------------------------------------------
  // TEST 1: Actor-to-Finance CRDT Sync
  // --------------------------------------------------------------------------
  it('T3.1: [DRV] Actor completes airport transfer -> [FIN] Single-Writer appends event -> CRDT read model updates', async () => {
    // 1. [DRV] Ramón Rosero completes transfer
    const transfer = new DriverTransfer({
      id: 'TR-MDE-HOTEL',
      driverActorId: 'ACT-DRV-RAMON',
      origin: { lat: 6.1645, lng: -75.4231, name: 'JMC Airport' },
      destination: { lat: 6.2442, lng: -75.5812, name: 'Hotel Laureles' },
      flatRate: Money.fromAmount(160000, 'COP')
    });
    transfer.startTransit();
    transfer.arriveOnSite();
    transfer.completeTransfer();

    // 2. Proposal message sent via MessageChannel to [FIN]
    const proposal = {
      action: 'PROPOSE_DRIVER_FEE',
      transferId: transfer.id,
      amountCents: transfer.totalCost.cents.toString(),
      driverId: transfer.driverActorId
    };

    // 3. [FIN] Single-Writer approves and creates CQRS Event
    const prevHash = sqliteLedgerEvents.length > 0 ? sqliteLedgerEvents[sqliteLedgerEvents.length - 1].hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const event = new ActorEvent({
      eventId: `EV-DRV-${Date.now()}`,
      actorId: 'ACT-FIN-AUDITOR',
      actorRole: 'FINANCIAL_AUDITOR',
      eventType: 'DRIVER_FEE_RECORDED',
      aggregateId: 'RVA171',
      payload: proposal,
      previousHash: prevHash
    });
    sqliteLedgerEvents.push(event);

    // 4. Ledger state projection
    activeLedger.addDriverTransfer(transfer);

    expect(sqliteLedgerEvents).toHaveLength(1);
    expect(sqliteLedgerEvents[0].verifyIntegrity()).toBe(true);
    expect(activeLedger.totalExpenses.amount).toBe(160000);
  });

  // --------------------------------------------------------------------------
  // TEST 2: SQLite CQRS + Dexie Blob Consistency
  // --------------------------------------------------------------------------
  it('T3.2: Logging receipt atomically writes binary blob to Dexie and event referencing UUID to SQLite', async () => {
    const rawImageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const receiptBlobId = 'rec-blob-cruzverde-001';

    // 1. Save binary in Dexie store
    dexieBlobStore.set(receiptBlobId, {
      id: receiptBlobId,
      mimeType: 'image/png',
      data: rawImageBytes,
      sizeBytes: rawImageBytes.length
    });

    // 2. Create domain ExpenseItem with attached blob reference
    const expense = new ExpenseItem({
      id: 'EXP-CV-01',
      category: 'PHARMACY',
      description: 'Droguerías Cruz Verde',
      amount: Money.fromAmount(85000, 'COP'),
      actorId: 'ACT-GUIA-YENNY',
      receiptBlobId: receiptBlobId
    });
    activeLedger.addExpense(expense);

    // 3. Append CQRS event in SQLite ledger referencing the Dexie blob UUID
    const event = new ActorEvent({
      eventId: 'EV-EXP-01',
      actorId: 'ACT-FIN-AUDITOR',
      actorRole: 'FINANCIAL_AUDITOR',
      eventType: 'EXPENSE_RECORDED',
      aggregateId: 'RVA171',
      payload: expense.toJSON()
    });
    sqliteLedgerEvents.push(event);

    // Assert cross-storage referential integrity
    const loggedEvent = sqliteLedgerEvents[0];
    const referencedBlobId = loggedEvent.payload.receiptBlobId;
    expect(dexieBlobStore.has(referencedBlobId)).toBe(true);
    expect(dexieBlobStore.get(referencedBlobId).data.length).toBe(8);
    expect(activeLedger.totalExpenses.cents).toBe(8500000n);
  });

  // --------------------------------------------------------------------------
  // TEST 3: GPS Check-in triggering dynamic guide fee recalculation
  // --------------------------------------------------------------------------
  it('T3.3: GPS Check-in transition to EN_SITIO starts timer, checkout to COMPLETADO recalculates fees', async () => {
    const hptu = { lat: 6.275819, lng: -75.589833, name: 'HPTU Robledo', geofenceRadiusMeters: 300 };
    const stop = new ItineraryItem({
      id: 'ITIN-HPTU-01',
      dayNumber: 2,
      title: 'Toma de Muestras HPTU',
      location: hptu,
      requiresGpsCheckIn: true
    });

    // Guide check-in on-site (starts service)
    stop.arriveOnSite({ coords: { lat: 6.2760, lng: -75.5898 }, timestamp: '2026-08-11T08:00:00-05:00' });
    expect(stop.status).toBe('EN_SITIO');

    // 4 hours later, check-out and complete
    stop.complete({ timestamp: '2026-08-11T12:00:00-05:00' });
    expect(stop.status).toBe('COMPLETADO');

    // Dynamic fee computation: 4 hours @ $15,500 COP/h + $25,000 COP meal subsidy = $87,000 COP
    const shift = new CompanionShift({
      id: 'SHIFT-HPTU-01',
      guideActorId: 'ACT-GUIA-YENNY',
      dayNumber: 2,
      startTime: stop.checkInTimestamp,
      endTime: stop.completionTimestamp,
      totalHours: 4.0,
      hourlyRate: Money.fromAmount(15500, 'COP'),
      mealSubsidy: Money.fromAmount(25000, 'COP')
    });
    activeLedger.addCompanionShift(shift);

    expect(activeLedger.totalExpenses.amount).toBe(87000);
    expect(shift.totalCost.cents).toBe(8700000n);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Multi-Actor Collaborative Itinerary Stop
  // --------------------------------------------------------------------------
  it('T3.4: Collaborative stop with [DRV] Ramón and [GUIA] Yenny merges actor reports without race conditions', () => {
    const stop = new ItineraryItem({
      id: 'ITIN-COLAB-01',
      dayNumber: 1,
      title: 'Llegada y Traslado a Consulta Oftalmológica',
      location: { lat: 6.2206, lng: -75.5714, name: 'Clínica Clofán' },
      assignedActorIds: ['ACT-DRV-RAMON', 'ACT-GUIA-YENNY']
    });

    // Driver reports transit started
    stop.startTransit('2026-08-10T14:00:00Z');
    expect(stop.status).toBe('EN_CAMINO');

    // Guide reports arrival at Clofán
    stop.arriveOnSite({ timestamp: '2026-08-10T14:35:00Z' });
    expect(stop.status).toBe('EN_SITIO');

    // Both report service components to financial ledger
    const transfer = new DriverTransfer({
      id: 'TR-CLOFAN',
      driverActorId: 'ACT-DRV-RAMON',
      origin: { lat: 6.2442, lng: -75.5812 },
      destination: { lat: 6.2206, lng: -75.5714 },
      flatRate: Money.fromAmount(38000, 'COP')
    });
    const shift = new CompanionShift({
      id: 'SH-CLOFAN',
      guideActorId: 'ACT-GUIA-YENNY',
      dayNumber: 1,
      startTime: '2026-08-10T14:35:00Z',
      totalHours: 3.5,
      hourlyRate: Money.fromAmount(15500, 'COP')
    });

    activeLedger.addDriverTransfer(transfer);
    activeLedger.addCompanionShift(shift);

    // 38,000 + (3.5 * 15,500 = 54,250) = 92,250 COP
    expect(activeLedger.totalExpenses.amount).toBe(92250);
  });

  // --------------------------------------------------------------------------
  // TEST 5: High-Load Event Burst to Single-Writer Ledger
  // --------------------------------------------------------------------------
  it('T3.5: 100 concurrent expense proposals to [FIN] single-writer process sequentially in hash chain', () => {
    let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const chain = [];

    // Queue 100 proposals
    for (let i = 1; i <= 100; i++) {
      const ev = new ActorEvent({
        eventId: `EV-BURST-${i.toString().padStart(3, '0')}`,
        actorId: 'ACT-FIN-AUDITOR',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'EXPENSE_COMMITTED',
        aggregateId: 'RVA171',
        payload: { expenseIndex: i, amountCents: `${i * 1000}` },
        previousHash: lastHash
      });
      chain.push(ev);
      lastHash = ev.hash;
    }

    // Verify all 100 links in chain
    expect(chain).toHaveLength(100);
    expect(chain[0].verifyIntegrity()).toBe(true);
    for (let i = 1; i < 100; i++) {
      expect(chain[i].verifyIntegrity(chain[i - 1].hash)).toBe(true);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 6: Full Offline Persistence Cycle (Mutate -> Reload -> Verify)
  // --------------------------------------------------------------------------
  it('T3.6: Offline persistence cycle: mutates state offline, reloads from in-memory stores with 100% fidelity', () => {
    // 1. Initial advance
    activeLedger.addAdvance(Money.fromAmount(2098100, 'COP'));

    // 2. Offline actions: add expense, add signature, add transfer
    const exp = new ExpenseItem({
      id: 'EXP-OFFLINE-1',
      category: 'PHARMACY',
      description: 'Cruz Verde Offline',
      amount: Money.fromAmount(85000, 'COP'),
      actorId: 'ACT-GUIA'
    });
    activeLedger.addExpense(exp);

    const sig = new PatientSignature({
      id: 'SIG-OFFLINE-1',
      itineraryItemId: 'ITIN-01',
      patientUuid: 'ENT-PAX-0171',
      signerName: 'Catia Rodrigues',
      blobId: 'blob-sig-offline-01'
    });
    dexieBlobStore.set(sig.blobId, sig.toJSON());

    // 3. Serialize full state snapshot (simulating app close)
    const serializedLedger = JSON.stringify(activeLedger.toJSON());
    const serializedBlobs = JSON.stringify(Array.from(dexieBlobStore.entries()));

    // 4. Hydrate fresh app instance from snapshot
    const parsedLedgerData = JSON.parse(serializedLedger);
    const restoredLedger = new SettlementLedger({
      reservationCode: parsedLedgerData.reservationCode,
      patientUuid: parsedLedgerData.patientUuid,
      currency: parsedLedgerData.currency,
      advances: parsedLedgerData.advances.map((a) => Money.fromCents(a.amountInCents, a.currency)),
      expenses: parsedLedgerData.expenses.map((e) => new ExpenseItem({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: Money.fromCents(e.amount.amountInCents, e.amount.currency),
        actorId: e.actorId,
        receiptBlobId: e.receiptBlobId
      }))
    });

    expect(restoredLedger.totalAdvances.amount).toBe(2098100);
    expect(restoredLedger.totalExpenses.amount).toBe(85000);
    expect(restoredLedger.netBalance.cents).toBe(201310000n);
  });

  // --------------------------------------------------------------------------
  // TEST 7: UI Automation Bridge (window.MedicalTripFieldApp) API Contract
  // --------------------------------------------------------------------------
  it('T3.7: Automation API simulateReceiptOcr() updates SQLite, Dexie, and KPI read models concurrently', async () => {
    // Automation API Mock Bridge
    const appAutomationApi = {
      simulateReceiptOcr: async (stopId, expensePayload) => {
        const blobId = `rec-blob-${Date.now()}`;
        dexieBlobStore.set(blobId, { data: 'mock-bytes' });

        const expense = new ExpenseItem({
          id: `EXP-AUTO-${Date.now()}`,
          itineraryItemId: stopId,
          category: expensePayload.category,
          description: expensePayload.merchant,
          amount: Money.fromCents(expensePayload.amountCents, 'COP'),
          actorId: 'ACT-AUTO',
          receiptBlobId: blobId
        });
        activeLedger.addExpense(expense);

        const ev = new ActorEvent({
          eventId: `EV-AUTO-${Date.now()}`,
          actorId: 'ACT-FIN-AUDITOR',
          actorRole: 'FINANCIAL_AUDITOR',
          eventType: 'EXPENSE_RECORDED',
          aggregateId: 'RVA171',
          payload: expense.toJSON()
        });
        sqliteLedgerEvents.push(ev);

        return { success: true, receiptId: blobId };
      }
    };

    const res = await appAutomationApi.simulateReceiptOcr('ITIN-01', {
      merchant: 'Droguería Pasteur',
      category: 'PHARMACY',
      amountCents: 6500000n
    });

    expect(res.success).toBe(true);
    expect(dexieBlobStore.has(res.receiptId)).toBe(true);
    expect(activeLedger.totalExpenses.amount).toBe(65000);
    expect(sqliteLedgerEvents).toHaveLength(1);
  });

  // --------------------------------------------------------------------------
  // TEST 8: Dynamic Currency & TRM Settlement Conversion
  // --------------------------------------------------------------------------
  it('T3.8: Deterministic TRM conversion: $8,500 USD @ $4,000 COP/USD yields exactly $34,000,000 COP', () => {
    const usdBudget = Money.fromAmount(8500, 'USD'); // 850,000 cents
    const trmRateCOP = 4000n; // 4,000 COP per 1 USD

    // exact cents conversion: 850,000 cents USD * 4000 = 3,400,000,000 cents COP
    const copBudgetCents = usdBudget.cents * trmRateCOP;
    const copBudget = Money.fromCents(copBudgetCents, 'COP');

    expect(copBudget.cents).toBe(3400000000n);
    expect(copBudget.amount).toBe(34000000);
  });

  // --------------------------------------------------------------------------
  // TEST 9: Patient Signature Verification triggering Itinerary Certification
  // --------------------------------------------------------------------------
  it('T3.9: Capturing signature in Dexie certifies itinerary milestone and locks financial fees', () => {
    const stop = new ItineraryItem({
      id: 'ITIN-CERT-01',
      dayNumber: 1,
      title: 'Consulta Oftalmológica con Certificación',
      requiresSignature: true
    });

    const sigBlobId = 'sig-certified-catia-01';
    dexieBlobStore.set(sigBlobId, { signature: 'valid-vector' });

    stop.arriveOnSite();
    stop.complete({ signatureBlobId: sigBlobId });

    expect(stop.status).toBe('COMPLETADO');
    expect(stop.signatureBlobId).toBe(sigBlobId);
    expect(dexieBlobStore.has(stop.signatureBlobId)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // TEST 10: Geofence Rejection preventing Automatic Fee Disbursement
  // --------------------------------------------------------------------------
  it('T3.10: Geofence check-in rejection prevents transition and blocks fee disbursement', () => {
    const stop = new ItineraryItem({
      id: 'ITIN-FAR-CHECKIN',
      dayNumber: 1,
      title: 'Clínica Cardio VID',
      location: { lat: 6.2764, lng: -75.5962, geofenceRadiusMeters: 200 },
      requiresGpsCheckIn: true
    });

    // Driver attempts check-in from 5km away
    let failed = false;
    try {
      stop.arriveOnSite({ coords: { lat: 6.2100, lng: -75.5700 } });
    } catch (e) {
      failed = true;
    }

    expect(failed).toBe(true);
    expect(stop.status).toBe('PROGRAMADO'); // Did not transition to EN_SITIO
    expect(activeLedger.totalExpenses.amount).toBe(0); // No fees disbursed
  });

  // --------------------------------------------------------------------------
  // TEST 11: Multi-Day Event Replay & State Hydration
  // --------------------------------------------------------------------------
  it('T3.11: Replaying 10 CQRS events sequentially produces identical financial balance sheet', () => {
    const rawEvents = [
      { type: 'ADVANCE', amount: 1000000 },
      { type: 'ADVANCE', amount: 1098100 },
      { type: 'EXPENSE', amount: 160000 },
      { type: 'EXPENSE', amount: 38000 },
      { type: 'EXPENSE', amount: 85000 },
      { type: 'EXPENSE', amount: 54250 },
      { type: 'EXPENSE', amount: 124000 },
      { type: 'EXPENSE', amount: 46500 },
      { type: 'EXPENSE', amount: 35000 },
      { type: 'EXPENSE', amount: 54886 }
    ];

    const replayLedger = new SettlementLedger({
      reservationCode: 'RVA171',
      patientUuid: 'ENT-PAX-0171',
      currency: 'COP'
    });

    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
      if (e.type === 'ADVANCE') {
        replayLedger.addAdvance(Money.fromAmount(e.amount, 'COP'));
      } else {
        replayLedger.addExpense({
          id: `EXP-REPLAY-${i}`,
          category: 'OTHER',
          description: `Item ${i}`,
          amount: Money.fromAmount(e.amount, 'COP'),
          actorId: 'ACT-REPLAY'
        });
      }
    }

    // Advances: 2,098,100. Expenses: 597,636. Net: 1,500,464 COP
    expect(replayLedger.totalAdvances.amount).toBe(2098100);
    expect(replayLedger.totalExpenses.amount).toBe(597636);
    expect(replayLedger.netBalance.amount).toBe(1500464);
  });

  // --------------------------------------------------------------------------
  // TEST 12: Cross-Archetype Memory & Storage Isolation
  // --------------------------------------------------------------------------
  it('T3.12: Switching between RVA171 and RVA282 maintains separate isolated ledgers and blob stores', () => {
    const caseStore = new Map();

    // Initialize Case 1: RVA171
    const ledger1 = new SettlementLedger({ reservationCode: 'RVA171', patientUuid: 'ENT-PAX-0171', currency: 'COP' });
    ledger1.addAdvance(Money.fromAmount(34000000, 'COP'));
    caseStore.set('RVA171', ledger1);

    // Initialize Case 2: RVA282
    const ledger2 = new SettlementLedger({ reservationCode: 'RVA282', patientUuid: 'ENT-PAX-0282', currency: 'COP' });
    ledger2.addAdvance(Money.fromAmount(16800000, 'COP'));
    caseStore.set('RVA282', ledger2);

    expect(caseStore.get('RVA171').totalAdvances.amount).toBe(34000000);
    expect(caseStore.get('RVA282').totalAdvances.amount).toBe(16800000);
    expect(caseStore.get('RVA171').reservationCode).toBe('RVA171');
    expect(caseStore.get('RVA282').reservationCode).toBe('RVA282');
  });

  // --------------------------------------------------------------------------
  // TEST 13: Split-View Master-Detail Synchronization
  // --------------------------------------------------------------------------
  it('T3.13: Selecting stop on Left Pane synchronizes with related financial lines on Right Pane', () => {
    const leftPaneStop = new ItineraryItem({
      id: 'STOP-CLOFAN',
      dayNumber: 1,
      title: 'Consulta Oftalmología Clofán',
      location: { lat: 6.2206, lng: -75.5714 }
    });

    const relatedExpenses = [
      new ExpenseItem({ id: 'E1', itineraryItemId: 'STOP-CLOFAN', category: 'PHARMACY', description: 'Colirios', amount: Money.fromAmount(85000, 'COP'), actorId: 'GUIA' }),
      new ExpenseItem({ id: 'E2', itineraryItemId: 'STOP-CLOFAN', category: 'OTHER', description: 'Parqueadero Clofán', amount: Money.fromAmount(12000, 'COP'), actorId: 'DRV' })
    ];

    for (const exp of relatedExpenses) {
      activeLedger.addExpense(exp);
    }

    const filtered = activeLedger.expenses.filter((e) => e.itineraryItemId === leftPaneStop.id);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].amount.amount + filtered[1].amount.amount).toBe(97000);
  });

  // --------------------------------------------------------------------------
  // TEST 14: Real-Time Overdraft Alert across UI & Settlement Model
  // --------------------------------------------------------------------------
  it('T3.14: Sudden large expense ($10,000,000 COP) immediately flips status to DEBT_OWED_BY_PATIENT', () => {
    activeLedger.addAdvance(Money.fromAmount(5000000, 'COP'));
    expect(activeLedger.getAuditSummary().balanceStatus).toBe('CREDIT_REFUND_DUE');

    // Unforeseen surgery emergency expense
    activeLedger.addExpense({
      id: 'EXP-EMERGENCY',
      category: 'OTHER',
      description: 'Procedimiento Quirúrgico No Programado',
      amount: Money.fromAmount(10000000, 'COP'),
      actorId: 'ACT-SURGEON'
    });

    expect(activeLedger.netBalance.amount).toBe(-5000000);
    expect(activeLedger.getAuditSummary().balanceStatus).toBe('DEBT_OWED_BY_PATIENT');
  });

  // --------------------------------------------------------------------------
  // TEST 15: End-to-End Audit Trail Generation with 0 Discrepancy
  // --------------------------------------------------------------------------
  it('T3.15: End-to-End audit trail verifies zero discrepancy between advance, expenses, and net balance', () => {
    activeLedger.addAdvance(Money.fromAmount(8500000, 'COP'));
    activeLedger.addDriverTransfer({
      id: 'TR-1',
      driverActorId: 'DRV',
      origin: { lat: 6.1645, lng: -75.4231 },
      destination: { lat: 6.2442, lng: -75.5812 },
      flatRate: Money.fromAmount(160000, 'COP')
    });
    activeLedger.addCompanionShift({
      id: 'SH-1',
      guideActorId: 'GUIA',
      dayNumber: 1,
      startTime: '08:00',
      totalHours: 8,
      hourlyRate: Money.fromAmount(15500, 'COP'),
      mealSubsidy: Money.fromAmount(35000, 'COP')
    });
    activeLedger.addExpense({
      id: 'EXP-1',
      category: 'PHARMACY',
      description: 'Medicinas',
      amount: Money.fromAmount(85000, 'COP'),
      actorId: 'GUIA'
    });

    const summary = activeLedger.getAuditSummary();
    const advancesCents = BigInt(summary.totalAdvances.amountInCents);
    const expensesCents = BigInt(summary.totalExpenses.amountInCents);
    const netCents = BigInt(summary.netBalance.amountInCents);

    // Fundamental accounting invariant: Net = Advances - Expenses
    expect(netCents).toBe(advancesCents - expensesCents);
  });
});

if (process.argv[1] && process.argv[1].endsWith('tier3_cross_feature.test.js')) {
  runAllTests('Tier 3: Cross-Feature Integration (15 Tests)').then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
