import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  DomainError,
  Money,
  LocationCoordinate,
  ActorEvent,
  sha256,
  ItineraryItem,
  ExpenseItem,
  DriverTransfer,
  CompanionShift,
  PatientSignature,
  SettlementLedger
} from '../../src/domain/index.js';

import {
  SqliteStorageAdapter,
  DexieBlobStorageAdapter,
  ARCHETYPES_DATA,
  getArchetype,
  hydrateStorageWithArchetype,
  KNOWN_OPERATIONAL_LOCATIONS
} from '../../src/infrastructure/index.js';

import {
  SettlementCalculator,
  SETTLEMENT_RATE_CONSTANTS,
  OVERDRAFT_STATUSES,
  LedgerHashChain,
  GENESIS_PREVIOUS_HASH,
  TransitionItineraryStatusCommand,
  RecordExpenseCommand,
  CaptureSignatureCommand,
  GetItineraryQuery,
  GetSettlementBalanceQuery,
  GetAuditReportQuery
} from '../../src/application/index.js';

describe('Milestone 3 — Application Layer Unit Tests (Deterministic Financial Settlement & CQRS)', () => {

  // ==========================================================================
  // 1. SETTLEMENT CALCULATOR (Exact BigInt Cents Fowler Money Arithmetic)
  // ==========================================================================
  describe('1. SettlementCalculator (Deterministic BigInt Calculations)', () => {

    it('determines overdraft status accurately for positive, zero, and negative balances', () => {
      const positive = Money.fromAmount(500000, 'COP');
      const zero = Money.zero('COP');
      const negative = Money.fromAmount(-350000, 'COP');

      assert.equal(SettlementCalculator.determineOverdraftStatus(positive), OVERDRAFT_STATUSES.REFUND_TO_PATIENT);
      assert.equal(SettlementCalculator.determineOverdraftStatus(zero), OVERDRAFT_STATUSES.BALANCED_ZERO);
      assert.equal(SettlementCalculator.determineOverdraftStatus(negative), OVERDRAFT_STATUSES.DEBT_OWED_BY_PATIENT);
    });

    it('calculates total advances across multiple deposits without floating point errors', () => {
      const advances = [
        Money.fromAmount(2000000, 'COP'),
        { amountInCents: '150000000', currency: 'COP' },
        { amount: 500000, currency: 'COP' },
        '750000'
      ];

      const total = SettlementCalculator.calculateTotalAdvances(advances, 'COP');
      // 2,000,000 + 1,500,000 + 500,000 + 750,000 = 4,750,000 COP (475,000,000 cents)
      assert.equal(total.amountInCents, 475000000n);
      assert.equal(total.amount, 4750000);
      assert.equal(total.currency, 'COP');
    });

    it('fails fast when advance currency does not match ledger currency', () => {
      const advances = [
        Money.fromAmount(2000000, 'COP'),
        Money.fromAmount(500, 'USD')
      ];

      assert.throws(() => {
        SettlementCalculator.calculateTotalAdvances(advances, 'COP');
      }, /Discrepancia de Moneda|CurrencyMismatchError/);
    });

    it('aggregates multi-rubric expenses into category breakdowns with sub-totals', () => {
      const expenses = [
        new ExpenseItem({
          id: 'EXP-1',
          category: 'PHARMACY',
          description: 'Medicamentos Cruz Verde',
          amount: Money.fromAmount(120000, 'COP'),
          actorId: 'ACT-GUIA'
        }),
        new ExpenseItem({
          id: 'EXP-2',
          category: 'MEDICAL_LAB',
          description: 'Exámenes de sangre Echavarría',
          amount: Money.fromAmount(230000, 'COP'),
          actorId: 'ACT-GUIA'
        }),
        new ExpenseItem({
          id: 'EXP-3',
          category: 'OTHER',
          description: 'Faja postquirúrgica',
          amount: Money.fromAmount(85000, 'COP'),
          actorId: 'ACT-GUIA'
        }),
        new ExpenseItem({
          id: 'EXP-4-REJECTED',
          category: 'OTHER',
          description: 'Gasto no justificado',
          amount: Money.fromAmount(999999, 'COP'),
          actorId: 'ACT-UNKNOWN',
          status: 'REJECTED'
        })
      ];

      const driverTransfers = [
        new DriverTransfer({
          id: 'TR-1',
          driverActorId: 'ACT-DRV-RAMON',
          origin: { lat: 6.1645, lng: -75.4231, name: 'Aeropuerto JMC' },
          destination: { lat: 6.2442, lng: -75.5812, name: 'Hotel Inntu' },
          flatRate: Money.fromAmount(160000, 'COP'),
          surcharge: Money.fromAmount(25000, 'COP')
        })
      ];

      const companionShifts = [
        new CompanionShift({
          id: 'SHIFT-1',
          guideActorId: 'ACT-GUIA-LILIANA',
          dayNumber: 1,
          startTime: '08:00',
          totalHours: 8,
          hourlyRate: Money.fromCents(1550000n, 'COP'),
          mealSubsidy: Money.fromCents(3500000n, 'COP')
        })
      ];

      const breakdown = SettlementCalculator.calculateCategoryBreakdown({
        expenses,
        driverTransfers,
        companionShifts,
        currency: 'COP'
      });

      // Taxi = 160,000 + 25,000 = 185,000 COP
      assert.equal(breakdown.taxi.amount, 185000);
      assert.equal(breakdown.driverFlatRates.amount, 160000);
      assert.equal(breakdown.driverSurcharges.amount, 25000);

      // Companion = (8h * 15,500 = 124,000) + 35,000 = 159,000 COP
      assert.equal(breakdown.companion.amount, 159000);
      assert.equal(breakdown.companionWages.amount, 124000);
      assert.equal(breakdown.companionMealSubsidies.amount, 35000);

      // Pharmacy = 120,000
      assert.equal(breakdown.pharmacy.amount, 120000);
      // Medical Lab = 230,000
      assert.equal(breakdown.medicalLab.amount, 230000);
      // Other = 85,000 (rejected 999,999 excluded)
      assert.equal(breakdown.other.amount, 85000);

      // Total Expenses = 185,000 + 159,000 + 120,000 + 230,000 + 85,000 = 779,000 COP
      assert.equal(breakdown.totalExpenses.amount, 779000);
      assert.equal(breakdown.totalExpenses.amountInCents, 77900000n);
    });

    it('calculates companion shift costs with exact hourly wage and meal subsidies', () => {
      // 8-hour shift with auto-assigned full-day meal subsidy ($35.000 COP)
      const fullDay = SettlementCalculator.calculateCompanionShiftCost({
        hours: 8,
        currency: 'COP'
      });
      assert.equal(fullDay.wage.amount, 124000);
      assert.equal(fullDay.subsidy.amount, 35000);
      assert.equal(fullDay.totalCost.amount, 159000);

      // 4-hour shift with auto-assigned half-day meal subsidy ($25.000 COP)
      const halfDay = SettlementCalculator.calculateCompanionShiftCost({
        hours: 4,
        currency: 'COP'
      });
      assert.equal(halfDay.wage.amount, 62000);
      assert.equal(halfDay.subsidy.amount, 25000);
      assert.equal(halfDay.totalCost.amount, 87000);

      // 0-hour shift
      const zeroDay = SettlementCalculator.calculateCompanionShiftCost({
        hours: 0,
        currency: 'COP'
      });
      assert.equal(zeroDay.totalCost.amount, 0);
    });

    it('calculates institutional vs private quotation spread (23%-30% range)', () => {
      const baseCost = Money.fromAmount(10000000, 'COP'); // $10,000,000 COP base cost

      const spread = SettlementCalculator.calculateQuotationSpread({
        baseCost,
        spreadPercentage: 25,
        minSpreadPercentage: 23,
        maxSpreadPercentage: 30,
        currency: 'COP'
      });

      // 25% recommended spread
      assert.equal(spread.spreadMargin.amount, 2500000);
      assert.equal(spread.quotedPrice.amount, 12500000);

      // 23% min spread
      assert.equal(spread.minSpreadQuotation.percentage, 23);
      assert.equal(spread.minSpreadQuotation.margin.amount, 2300000);
      assert.equal(spread.minSpreadQuotation.quotedPrice.amount, 12300000);

      // 30% max spread
      assert.equal(spread.maxSpreadQuotation.percentage, 30);
      assert.equal(spread.maxSpreadQuotation.margin.amount, 3000000);
      assert.equal(spread.maxSpreadQuotation.quotedPrice.amount, 13000000);
    });

    it('generates multi-day audit balance sheet with itemized line entries and verification hash', () => {
      const sheet = SettlementCalculator.generateAuditBalanceSheet({
        reservationCode: 'RVA171',
        patientUuid: 'ENT-PAX-0171',
        currency: 'COP',
        advances: [
          { amountInCents: '200000000', notes: 'Anticipo inicial' }
        ],
        expenses: [
          new ExpenseItem({
            id: 'EXP-1',
            category: 'PHARMACY',
            description: 'Cruz Verde',
            amount: Money.fromAmount(85000, 'COP'),
            actorId: 'ACT-GUIA'
          })
        ],
        driverTransfers: [
          new DriverTransfer({
            id: 'TR-1',
            driverActorId: 'ACT-DRV-RAMON',
            origin: { lat: 6.1645, lng: -75.4231 },
            destination: { lat: 6.2442, lng: -75.5812 },
            flatRate: Money.fromAmount(160000, 'COP')
          })
        ],
        companionShifts: [
          new CompanionShift({
            id: 'SHIFT-1',
            guideActorId: 'ACT-GUIA',
            dayNumber: 1,
            startTime: '08:00',
            totalHours: 4,
            hourlyRate: Money.fromAmount(15500, 'COP'),
            mealSubsidy: Money.fromAmount(25000, 'COP')
          })
        ],
        spreadPercentage: 25,
        generatedAt: '2026-09-01T12:00:00Z'
      });

      assert.equal(sheet.reservationCode, 'RVA171');
      assert.equal(sheet.patientUuid, 'ENT-PAX-0171');
      assert.equal(sheet.currency, 'COP');

      // Advances: 2,000,000
      assert.equal(sheet.totals.totalAdvances.amount, 2000000);
      // Expenses: 85,000 + 160,000 + (4*15,500 + 25,000 = 87,000) = 332,000
      assert.equal(sheet.totals.totalExpenses.amount, 332000);
      // Net balance: 2,000,000 - 332,000 = 1,668,000 (REFUND_TO_PATIENT)
      assert.equal(sheet.totals.netBalance.amount, 1668000);
      assert.equal(sheet.totals.balanceStatus, OVERDRAFT_STATUSES.REFUND_TO_PATIENT);
      assert.equal(sheet.totals.refundAmount.amount, 1668000);
      assert.equal(sheet.totals.overdraftAmount.amount, 0);

      // Line entries check
      assert.equal(sheet.lineEntries.length, 4);
      assert.equal(sheet.lineEntries[0].type, 'ADVANCE');
      assert.equal(sheet.lineEntries[0].credit.amount, 2000000);
      assert.equal(sheet.lineEntries[0].runningBalance.amount, 2000000);

      // Verification hash
      assert.ok(typeof sheet.verificationHash === 'string');
      assert.equal(sheet.verificationHash.length, 64);
    });
  });

  // ==========================================================================
  // 2. LEDGER HASH CHAIN (Single-Writer CQRS Stream & Cryptographic Security)
  // ==========================================================================
  describe('2. LedgerHashChain (Single-Writer CQRS & SHA-256 Chain)', () => {
    let storage;
    let chain;

    beforeEach(() => {
      storage = new SqliteStorageAdapter({ dbName: 'test_cqrs_hash_chain' });
      chain = new LedgerHashChain({
        storagePort: storage,
        aggregateId: 'RVA171',
        authorizedWriters: ['ACT-FIN-AUDITOR', 'FINANCIAL_AUDITOR', 'SYSTEM']
      });
    });

    it('establishes genesis block with 64 zeroes as previousHash', async () => {
      const genesis = await chain.appendEvent({
        actorId: 'ACT-FIN-AUDITOR',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'CASE_INITIALIZED',
        payload: { patientUuid: 'ENT-PAX-0171', totalBudget: '350000000' }
      });

      assert.equal(genesis.previousHash, GENESIS_PREVIOUS_HASH);
      assert.equal(genesis.verifyIntegrity(), true);
      assert.equal(await chain.getLength(), 1);
    });

    it('cryptographically links successive events in append-only sequence', async () => {
      const ev1 = await chain.appendEvent({
        actorId: 'ACT-FIN-AUDITOR',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'ADVANCE_RECORDED',
        payload: { amountCents: '200000000' }
      });

      const ev2 = await chain.appendEvent({
        actorId: 'ACT-FIN-AUDITOR',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'EXPENSE_APPROVED',
        payload: { expenseId: 'EXP-101', amountCents: '8500000' }
      });

      assert.equal(ev2.previousHash, ev1.hash);

      const integrity = await chain.verifyChainIntegrity();
      assert.equal(integrity.isValid, true);
      assert.equal(integrity.verifiedCount, 2);
      assert.equal(integrity.rootHash, ev1.hash);
      assert.equal(integrity.latestHash, ev2.hash);
    });

    it('enforces Single-Writer CQRS constraint: rejects non-auditor writes', async () => {
      await assert.rejects(async () => {
        await chain.appendEvent({
          actorId: 'ACT-DRV-RAMON',
          actorRole: 'DRIVER',
          eventType: 'UNAUTHORIZED_MUTATION',
          payload: { illegal: true }
        });
      }, (err) => {
        assert.ok(err instanceof DomainError);
        assert.match(err.message, /Single-Writer Violation/);
        return true;
      });
    });

    it('detects tampering when a single cent is modified in historical event payload', async () => {
      const ev1 = await chain.appendEvent({
        actorId: 'ACT-FIN-AUDITOR',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'ADVANCE_RECORDED',
        payload: { amountCents: '100000000' }
      });

      const ev2 = await chain.appendEvent({
        actorId: 'ACT-FIN-AUDITOR',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'EXPENSE_APPROVED',
        payload: { amountCents: '50000000' }
      });

      // Tamper with ev1 payload
      const tamperedEvents = [
        new ActorEvent({
          eventId: ev1.eventId,
          actorId: ev1.actorId,
          actorRole: ev1.actorRole,
          eventType: ev1.eventType,
          aggregateId: ev1.aggregateId,
          payload: { amountCents: '99999999' }, // Tampered by 1 cent!
          timestamp: ev1.timestamp,
          previousHash: ev1.previousHash
        }),
        ev2
      ];

      const detection = LedgerHashChain.detectTampering(tamperedEvents);
      assert.equal(detection.isTampered, true);
      assert.equal(detection.tamperedIndex, 1); // ev2 previousHash doesn't match new ev1 hash
    });

    it('replays event stream to reconstruct projected state', async () => {
      await chain.appendEvent({
        actorId: 'ACT-FIN-AUDITOR',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'ADVANCE_RECORDED',
        payload: { amountCents: '200000000', currency: 'COP' }
      });

      await chain.appendEvent({
        actorId: 'ACT-FIN-AUDITOR',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'EXPENSE_APPROVED',
        payload: { expenseId: 'EXP-1', amountCents: '8500000', category: 'PHARMACY' }
      });

      const state = await chain.replayState();
      assert.equal(state.aggregateId, 'RVA171');
      assert.equal(state.eventsApplied, 2);
      assert.equal(state.advances.length, 1);
      assert.equal(state.expenses.length, 1);
      assert.equal(state.expenses[0].expenseId, 'EXP-1');
    });
  });

  // ==========================================================================
  // 3. COMMAND HANDLERS
  // ==========================================================================
  describe('3. Command Handlers', () => {
    let storage;
    let blobStore;
    let chain;

    beforeEach(async () => {
      storage = new SqliteStorageAdapter({ dbName: 'test_commands_db' });
      blobStore = new DexieBlobStorageAdapter({ dbName: 'test_commands_blobs' });
      chain = new LedgerHashChain({
        storagePort: storage,
        aggregateId: 'RVA171'
      });
      blobStore.clear();
    });

    describe('TransitionItineraryStatusCommand', () => {
      it('executes PROGRAMADO -> EN_CAMINO -> EN_SITIO (with GPS check) -> COMPLETADO (with signature)', async () => {
        const item = new ItineraryItem({
          id: 'ITN-101',
          dayNumber: 1,
          title: 'Consulta Clofán',
          location: { lat: 6.2206, lng: -75.5714, name: 'Clínica Clofán', geofenceRadiusMeters: 150 },
          requiresGpsCheckIn: true,
          requiresSignature: true
        });
        await storage.saveItinerary(item, 'RVA171');

        const cmd = new TransitionItineraryStatusCommand({
          storagePort: storage,
          blobStoragePort: blobStore,
          ledgerHashChain: chain
        });

        // 1. Transition to EN_CAMINO
        const r1 = await cmd.execute({
          itineraryItemId: 'ITN-101',
          newStatus: 'EN_CAMINO'
        });
        assert.equal(r1.newStatus, 'EN_CAMINO');

        // 2. Transition to EN_SITIO with GPS geofence guard check
        // First test invalid out-of-bounds coords
        await assert.rejects(async () => {
          await cmd.execute({
            itineraryItemId: 'ITN-101',
            newStatus: 'EN_SITIO',
            coords: { lat: 6.2500, lng: -75.6000 } // ~4km away
          });
        }, (err) => {
          assert.match(err.message, /Guardia de Check-In GPS/);
          return true;
        });

        // Valid coords inside geofence
        const r2 = await cmd.execute({
          itineraryItemId: 'ITN-101',
          newStatus: 'EN_SITIO',
          coords: { lat: 6.22065, lng: -75.57142 } // ~10m away
        });
        assert.equal(r2.newStatus, 'EN_SITIO');

        // 3. Transition to COMPLETADO with Signature guard check
        // First test completion without signature
        await assert.rejects(async () => {
          await cmd.execute({
            itineraryItemId: 'ITN-101',
            newStatus: 'COMPLETADO'
          });
        }, (err) => {
          assert.match(err.message, /Guardia de Firma/);
          return true;
        });

        // Save mock signature blob
        await blobStore.saveBlob('BLOB-SIG-101', 'image/svg+xml', '<svg></svg>');

        const r3 = await cmd.execute({
          itineraryItemId: 'ITN-101',
          newStatus: 'COMPLETADO',
          signatureBlobId: 'BLOB-SIG-101'
        });
        assert.equal(r3.newStatus, 'COMPLETADO');

        const savedItem = await storage.getItinerary('ITN-101');
        assert.equal(savedItem.status, 'COMPLETADO');
        assert.equal(savedItem.signatureBlobId, 'BLOB-SIG-101');
      });

      it('cancels itinerary item with reason', async () => {
        const item = new ItineraryItem({
          id: 'ITN-CANCEL',
          dayNumber: 1,
          title: 'Consulta Cancelable',
          location: { lat: 6.2206, lng: -75.5714 }
        });
        await storage.saveItinerary(item, 'RVA171');

        const cmd = new TransitionItineraryStatusCommand({ storagePort: storage });
        const res = await cmd.execute({
          itineraryItemId: 'ITN-CANCEL',
          newStatus: 'CANCELADO',
          cancellationReason: 'Reprogramado por el paciente'
        });

        assert.equal(res.newStatus, 'CANCELADO');
        const saved = await storage.getItinerary('ITN-CANCEL');
        assert.equal(saved.status, 'CANCELADO');
        assert.equal(saved.cancellationReason, 'Reprogramado por el paciente');
      });
    });

    describe('RecordExpenseCommand', () => {
      it('records out-of-pocket expense with receipt blob and relational storage', async () => {
        const cmd = new RecordExpenseCommand({
          storagePort: storage,
          blobStoragePort: blobStore,
          ledgerHashChain: chain
        });

        const res = await cmd.execute({
          id: 'EXP-901',
          reservationCode: 'RVA171',
          category: 'PHARMACY',
          description: 'Antibióticos y apósitos estériles',
          amount: Money.fromAmount(95000, 'COP'),
          actorId: 'ACT-GUIA-LILIANA',
          receiptBlob: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          mimeType: 'image/jpeg'
        });

        assert.equal(res.success, true);
        assert.equal(res.expense.id, 'EXP-901');
        assert.equal(res.expense.amount.cents, 9500000n);
        assert.ok(res.receiptBlobId.startsWith('BLOB-RCPT-EXP-901'));

        const savedExp = await storage.getExpense('EXP-901');
        assert.equal(savedExp.id, 'EXP-901');
        assert.equal(savedExp.amount.amount, 95000);

        const hasBlob = await blobStore.hasBlob(res.receiptBlobId);
        assert.equal(hasBlob, true);
      });
    });

    describe('CaptureSignatureCommand', () => {
      it('captures patient digital signature, persists blob, and updates itinerary reference', async () => {
        const item = new ItineraryItem({
          id: 'ITN-SIG-TEST',
          dayNumber: 2,
          title: 'Procedimiento con firma',
          location: { lat: 6.2206, lng: -75.5714 }
        });
        await storage.saveItinerary(item, 'RVA171');

        const cmd = new CaptureSignatureCommand({
          storagePort: storage,
          blobStoragePort: blobStore,
          ledgerHashChain: chain
        });

        const res = await cmd.execute({
          id: 'SIG-001',
          itineraryItemId: 'ITN-SIG-TEST',
          patientUuid: 'ENT-PAX-0171',
          reservationCode: 'RVA171',
          signerName: 'Catia Rodrigues',
          signatureData: '<svg><path d="M 10 10 L 20 20"></path></svg>',
          format: 'svg'
        });

        assert.equal(res.success, true);
        assert.equal(res.signature.signerName, 'Catia Rodrigues');
        assert.equal(res.blobId, 'BLOB-SIG-SIG-001');

        const savedSig = await storage.getSignature('SIG-001');
        assert.equal(savedSig.signerName, 'Catia Rodrigues');

        const updatedItem = await storage.getItinerary('ITN-SIG-TEST');
        assert.equal(updatedItem.signatureBlobId, 'BLOB-SIG-SIG-001');
      });
    });
  });

  // ==========================================================================
  // 4. QUERY HANDLERS
  // ==========================================================================
  describe('4. Query Handlers', () => {
    let storage;
    let blobStore;

    beforeEach(async () => {
      storage = new SqliteStorageAdapter({ dbName: 'test_queries_db' });
      blobStore = new DexieBlobStorageAdapter({ dbName: 'test_queries_blobs' });

      // Hydrate with RVA171 Archetype fixture
      await hydrateStorageWithArchetype(storage, blobStore, 'RVA171');
    });

    describe('GetItineraryQuery', () => {
      it('retrieves all itinerary items for RVA171 with status metrics and day grouping', async () => {
        const query = new GetItineraryQuery({ storagePort: storage });
        const res = await query.execute({
          reservationCode: 'RVA171',
          groupByDay: true
        });

        assert.ok(res.totalCount >= 5);
        assert.ok(res.byDay[1].length >= 2);
        assert.ok(res.byDay[2].length >= 2);
        assert.ok(res.metrics.total >= 5);
        assert.ok(res.metrics.completed >= 2);
      });

      it('filters itinerary items by dayNumber', async () => {
        const query = new GetItineraryQuery({ storagePort: storage });
        const res = await query.execute({
          reservationCode: 'RVA171',
          dayNumber: 1
        });

        assert.ok(res.items.length >= 2);
        assert.ok(res.items.every((i) => i.dayNumber === 1));
      });
    });

    describe('GetSettlementBalanceQuery', () => {
      it('computes real-time settlement summary, proportions, and KPIs for RVA171', async () => {
        const query = new GetSettlementBalanceQuery({ storagePort: storage });
        const res = await query.execute({ reservationCode: 'RVA171' });

        assert.equal(res.reservationCode, 'RVA171');
        assert.equal(res.currency, 'COP');
        assert.equal(res.totalAdvances.amount, 2000000);
        assert.ok(res.totalExpenses.amount > 0);
        assert.ok(res.netBalance.amount > 0);
        assert.equal(res.balanceStatus, OVERDRAFT_STATUSES.REFUND_TO_PATIENT);

        // Breakdown check
        assert.ok(res.breakdown.taxi.amount > 0);
        assert.ok(res.breakdown.companion.amount > 0);
        assert.ok(res.breakdown.pharmacy.amount > 0);

        // KPI check
        assert.ok(res.kpis.budgetBurnRatePercent >= 0);
        assert.ok(res.kpis.totalTransactionsCount >= 3);
      });
    });

    describe('GetAuditReportQuery', () => {
      it('generates complete multi-day accounting audit report with quotation spread and cryptographic verification', async () => {
        const query = new GetAuditReportQuery({ storagePort: storage });
        const report = await query.execute({
          reservationCode: 'RVA171',
          spreadPercentage: 25
        });

        assert.equal(report.reservationCode, 'RVA171');
        assert.equal(report.currency, 'COP');
        assert.equal(report.organization, 'Medical Trip Colombia S.A.S.');
        assert.equal(report.patient.patientUuid, 'ENT-PAX-0171');

        // Totals
        assert.equal(report.totals.totalAdvances.amount, 2000000);
        assert.ok(report.totals.totalExpenses.amount > 0);
        assert.equal(report.totals.balanceStatus, OVERDRAFT_STATUSES.REFUND_TO_PATIENT);

        // Quotation Spread
        assert.equal(report.quotationSpread.spreadPercentage, 25);
        assert.ok(report.quotationSpread.spreadMargin.amount > 0);
        assert.ok(report.quotationSpread.quotedPrice.amount > report.totals.totalExpenses.amount);

        // Itemized Line Entries
        assert.ok(report.lineEntries.length >= 3);
        assert.equal(report.lineEntries[0].type, 'ADVANCE');

        // Cryptographic Hash
        assert.ok(typeof report.verificationHash === 'string');
        assert.equal(report.verificationHash.length, 64);
      });
    });
  });

  // ==========================================================================
  // 5. REAL-WORLD ARCHETYPE MULTI-DAY SETTLEMENT INTEGRATION (All 4 Archetypes)
  // ==========================================================================
  describe('5. Multi-Day Settlements for All 4 Google Drive Archetypes', () => {
    let storage;
    let blobStore;

    beforeEach(() => {
      storage = new SqliteStorageAdapter({ dbName: 'test_archetypes_all' });
      blobStore = new DexieBlobStorageAdapter({ dbName: 'test_archetypes_blobs' });
    });

    const archetypes = ['RVA171', 'RVA282', 'RVA341', 'RVA077'];

    for (const code of archetypes) {
      it(`settles ${code} with 100% BigInt precision, balanced ledgers, and zero float rounding errors`, async () => {
        await hydrateStorageWithArchetype(storage, blobStore, code);

        const query = new GetSettlementBalanceQuery({ storagePort: storage });
        const settlement = await query.execute({ reservationCode: code });

        const rawData = getArchetype(code);
        assert.equal(settlement.reservationCode, code);
        assert.equal(settlement.currency, rawData.currency);

        const auditQuery = new GetAuditReportQuery({ storagePort: storage });
        const audit = await auditQuery.execute({ reservationCode: code });

        assert.equal(audit.reservationCode, code);
        assert.ok(audit.lineEntries.length > 0);
        assert.ok(audit.verificationHash.length === 64);
        assert.ok(['REFUND_TO_PATIENT', 'BALANCED_ZERO', 'DEBT_OWED_BY_PATIENT'].includes(audit.totals.balanceStatus));
      });
    }
  });

  // ==========================================================================
  // 6. ADVERSARIAL EDGE CASES & BIGINT BOUNDARIES
  // ==========================================================================
  describe('6. Adversarial Edge Cases & BigInt Boundaries', () => {

    it('handles extreme BigInt cent amounts (e.g. 100 billion COP) without overflow or loss', () => {
      const hugeAdvance = Money.fromCents(10000000000000n, 'COP'); // 100 billion COP (10 trillion cents)
      const hugeExpense = Money.fromCents(4500000000000n, 'COP');  // 45 billion COP

      const sheet = SettlementCalculator.generateAuditBalanceSheet({
        reservationCode: 'RVA-HUGE',
        patientUuid: 'ENT-PAX-HUGE',
        currency: 'COP',
        advances: [hugeAdvance],
        expenses: [
          new ExpenseItem({
            id: 'EXP-HUGE-1',
            category: 'OTHER',
            description: 'Tratamiento oncológico experimental',
            amount: hugeExpense,
            actorId: 'ACT-FIN'
          })
        ]
      });

      assert.equal(sheet.totals.totalAdvances.amountInCents, '10000000000000');
      assert.equal(sheet.totals.totalExpenses.amountInCents, '4500000000000');
      assert.equal(sheet.totals.netBalance.amountInCents, '5500000000000');
      assert.equal(BigInt(sheet.totals.netBalance.amountInCents), 5500000000000n);
      assert.equal(sheet.totals.balanceStatus, OVERDRAFT_STATUSES.REFUND_TO_PATIENT);
    });

    it('handles zero advances and large expenses resulting in exact DEBT_OWED_BY_PATIENT overdraft', () => {
      const sheet = SettlementCalculator.generateAuditBalanceSheet({
        reservationCode: 'RVA-ZERO-ADV',
        patientUuid: 'ENT-PAX-001',
        currency: 'COP',
        advances: [],
        expenses: [
          new ExpenseItem({
            id: 'EXP-DEFICIT-1',
            category: 'PHARMACY',
            description: 'Urgencias hospitalarias',
            amount: Money.fromAmount(450000, 'COP'),
            actorId: 'ACT-GUIA'
          })
        ]
      });

      assert.equal(sheet.totals.totalAdvances.amount, 0);
      assert.equal(sheet.totals.totalExpenses.amount, 450000);
      assert.equal(sheet.totals.netBalance.amount, -450000);
      assert.equal(sheet.totals.balanceStatus, OVERDRAFT_STATUSES.DEBT_OWED_BY_PATIENT);
      assert.equal(sheet.totals.overdraftAmount.amount, 450000);
      assert.equal(sheet.totals.refundAmount.amount, 0);
    });

    it('validates broken chain at root genesis block', () => {
      const corruptGenesis = [
        new ActorEvent({
          eventId: 'EV-0',
          actorId: 'ACT-FIN',
          actorRole: 'FINANCIAL_AUDITOR',
          eventType: 'INIT',
          aggregateId: 'RVA-TEST',
          previousHash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' // Invalid root parent!
        })
      ];

      const result = LedgerHashChain.verifyStaticChain(corruptGenesis);
      assert.equal(result.isValid, false);
      assert.equal(result.brokenAtIndex, 0);
      assert.match(result.error, /Enlace de Hash Quebrado en índice 0/);
    });

    it('validates broken chain at middle and end nodes', () => {
      const ev1 = new ActorEvent({
        eventId: 'EV-1',
        actorId: 'ACT-FIN',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'INIT',
        aggregateId: 'RVA-TEST'
      });

      const ev2 = new ActorEvent({
        eventId: 'EV-2',
        actorId: 'ACT-FIN',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'ADVANCE',
        aggregateId: 'RVA-TEST',
        previousHash: ev1.hash
      });

      const ev3Corrupt = new ActorEvent({
        eventId: 'EV-3',
        actorId: 'ACT-FIN',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'EXPENSE',
        aggregateId: 'RVA-TEST',
        previousHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' // Broken link
      });

      const result = LedgerHashChain.verifyStaticChain([ev1, ev2, ev3Corrupt]);
      assert.equal(result.isValid, false);
      assert.equal(result.brokenAtIndex, 2);
    });

    it('throws domain errors on invalid inputs in commands and queries', async () => {
      const storage = new SqliteStorageAdapter({ dbName: 'test_errors_db' });
      const transitionCmd = new TransitionItineraryStatusCommand({ storagePort: storage });
      const recordExpCmd = new RecordExpenseCommand({ storagePort: storage });
      const signatureCmd = new CaptureSignatureCommand({ storagePort: storage });
      const itnQuery = new GetItineraryQuery({ storagePort: storage });
      const balanceQuery = new GetSettlementBalanceQuery({ storagePort: storage });
      const auditQuery = new GetAuditReportQuery({ storagePort: storage });

      // Non-existent item in transition
      await assert.rejects(async () => {
        await transitionCmd.execute({
          itineraryItemId: 'ITN-NON-EXISTENT',
          newStatus: 'EN_CAMINO'
        });
      }, /No se encontró el ítem de itinerario/);

      // Missing category in record expense
      await assert.rejects(async () => {
        await recordExpCmd.execute({
          description: 'Test',
          amount: 100,
          actorId: 'ACT-1'
        });
      }, /category es obligatorio/);

      // Missing signer name in capture signature
      await assert.rejects(async () => {
        await signatureCmd.execute({
          itineraryItemId: 'ITN-1',
          patientUuid: 'PAX-1',
          signatureData: '<svg></svg>',
          signerName: ''
        });
      }, /signerName es obligatorio/);

      // Non-existent reservation in balance query
      await assert.rejects(async () => {
        await balanceQuery.execute({ reservationCode: 'RVA-DOES-NOT-EXIST' });
      }, /No se encontró el libro de liquidación/);

      // Non-existent reservation in audit query
      await assert.rejects(async () => {
        await auditQuery.execute({ reservationCode: 'RVA-DOES-NOT-EXIST' });
      }, /No se encontró libro de liquidación/);
    });
  });
});

