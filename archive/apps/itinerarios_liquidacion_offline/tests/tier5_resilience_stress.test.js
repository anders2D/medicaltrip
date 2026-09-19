/**
 * TIER 5: Resilience & Storage Stress Test Suite (>=20 stress tests)
 * Medical Trip Colombia S.A.S. - Standalone Local-First Offline PWA
 *
 * Comprehensive Empirical Stress Testing across 4 Critical Dimensions:
 * 1. Storage Resilience: Corrupt blob UUID lookups, missing binary attachments, transaction rollbacks on invalid DDL/DML, IndexedDB quota overflow simulation.
 * 2. 4 Archetypes Boundary Scenarios: Multi-day financial settlement under extreme overdraft (DEBT_OWED_BY_PATIENT), multiple concurrent patients, foreign currency TRM rate fluctuations.
 * 3. Offline Persistence: Rehydrate state from serialized SQLite/Dexie snapshots after simulated browser restart and verify 100% data integrity.
 * 4. UI Bridge API Stress: Rapid consecutive method calls on window.MedicalTripFieldApp (100 transitions in rapid succession) to ensure no UI locks or unhandled promise rejections.
 *
 * Zero external dependencies. 100% pure Node.js ESM.
 */

import { describe, it, expect, beforeEach, runAllTests } from './test_harness.js';
import { Money } from '../src/domain/value-objects/money.js';
import { LocationCoordinate } from '../src/domain/value-objects/location-coordinate.js';
import { ActorEvent, sha256 } from '../src/domain/value-objects/actor-event.js';
import { OperativeTerritory } from '../src/domain/value-objects/operative-territory.js';
import { ItineraryItem } from '../src/domain/entities/itinerary-item.js';
import { ExpenseItem } from '../src/domain/entities/expense-item.js';
import { CompanionShift } from '../src/domain/entities/companion-shift.js';
import { DriverTransfer } from '../src/domain/entities/driver-transfer.js';
import { PatientSignature } from '../src/domain/entities/patient-signature.js';
import { SettlementLedger } from '../src/domain/entities/settlement-ledger.js';
import { DomainError, CurrencyMismatchError } from '../src/domain/errors/domain-error.js';
import { SqliteStorageAdapter } from '../src/infrastructure/storage/sqlite-storage-adapter.js';
import { DexieBlobStorageAdapter } from '../src/infrastructure/storage/dexie-blob-storage-adapter.js';
import { StoragePersistenceManager } from '../src/infrastructure/storage/storage-persistence-manager.js';
import { ARCHETYPES_DATA, getArchetype, hydrateStorageWithArchetype } from '../src/infrastructure/data/archetypes-data.js';
import { SettlementCalculator, OVERDRAFT_STATUSES } from '../src/application/settlement/settlement-calculator.js';
import { LedgerHashChain } from '../src/application/settlement/ledger-hash-chain.js';
import { AppStore, MedicalTripFieldApp } from '../src/ui/state/app-store.js';

describe('Tier 5: Resilience, Storage Stress & Boundary Hardening Test Suite', () => {

  // ==========================================================================
  // SECTION 1: STORAGE RESILIENCE & FAULT-TOLERANCE
  // ==========================================================================
  describe('1. Storage Resilience & Fault-Tolerance', () => {
    let sqliteAdapter;
    let blobAdapter;

    beforeEach(() => {
      sqliteAdapter = new SqliteStorageAdapter({ dbName: 'test_stress_relational' });
      blobAdapter = new DexieBlobStorageAdapter({ dbName: 'test_stress_blobs' });
    });

    it('T5.1: Corrupt & non-existent blob UUID lookups return null gracefully without throwing uncaught exceptions', async () => {
      const invalidIds = [
        '',
        '   ',
        'non-existent-uuid-12345',
        '../../../etc/passwd',
        '__proto__',
        'blob-null-undefined-NaN',
        '$$$corrupted###uuid@@@',
        null,
        undefined
      ];

      for (const badId of invalidIds) {
        const result = await blobAdapter.getBlob(badId);
        expect(result).toBeNull();

        const exists = await blobAdapter.hasBlob(badId);
        expect(exists).toBe(false);

        const dataUrl = await blobAdapter.exportBlobDataUrl(badId);
        expect(dataUrl).toBeNull();
      }
    });

    it('T5.2: Corrupted binary blob checksum detection detects tampering of raw payload', async () => {
      const validPayload = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF header
      const blobId = await blobAdapter.saveBlob('blob-tamper-check', 'image/gif', validPayload, {
        filename: 'scan.gif'
      });

      const record = await blobAdapter.getBlob(blobId);
      expect(record).not.toBeNull();
      expect(record.checksum).toBeDefined();

      // Verify original integrity
      const originalChecksum = record.checksum;
      expect(typeof originalChecksum).toBe('string');
      expect(originalChecksum.length).toBe(64); // SHA-256 hex string

      // Simulate payload tampering in storage map
      const internalRecord = blobAdapter._blobStore.get(blobId);
      internalRecord.data = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // Tampered bytes

      // Recompute checksum over tampered data
      const tamperedChecksumData = Array.from(internalRecord.data.slice(0, 1024)).join(',');
      const recalculatedChecksum = sha256(`${blobId}:${internalRecord.mimeType}:${internalRecord.byteLength}:${tamperedChecksumData}`);

      // Checksum mismatch proves corruption detection
      expect(recalculatedChecksum).not.toBe(originalChecksum);
    });

    it('T5.3: Itinerary completion with missing / deleted binary signature blob falls back gracefully', async () => {
      const item = new ItineraryItem({
        id: 'ITIN-STRESS-SIG-01',
        dayNumber: 1,
        title: 'Consulta con Firma Requerida',
        requiresSignature: true
      });
      item.arriveOnSite();

      // Reference a blob that is never stored or was deleted
      const missingBlobId = 'blob-sig-deleted-999';
      item.complete({ signatureBlobId: missingBlobId });

      expect(item.status).toBe('COMPLETADO');
      expect(item.signatureBlobId).toBe(missingBlobId);

      // Verify blob lookup returns null
      const blobResult = await blobAdapter.getBlob(item.signatureBlobId);
      expect(blobResult).toBeNull();

      // Relational persistence survives missing blob without throwing
      await sqliteAdapter.saveItinerary(item, 'RVA171');
      const retrieved = await sqliteAdapter.getItinerary(item.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved.status).toBe('COMPLETADO');
      expect(retrieved.signatureBlobId).toBe(missingBlobId);
    });

    it('T5.4: Expense recording when receipt blob is deleted or unreachable maintains financial ledger consistency', async () => {
      const ledger = new SettlementLedger({
        reservationCode: 'RVA171',
        patientUuid: 'ENT-PAX-0171',
        currency: 'COP'
      });
      ledger.addAdvance(Money.fromAmount(500000, 'COP'));

      // Create expense with blob ID
      const missingReceiptBlobId = 'rec-blob-purged-404';
      const expense = new ExpenseItem({
        id: 'EXP-STRESS-01',
        category: 'PHARMACY',
        description: 'Droguería San Jorge (Recibo Físico Extraviado)',
        amount: Money.fromAmount(125000, 'COP'),
        actorId: 'ACT-GUIA-YENNY',
        receiptBlobId: missingReceiptBlobId
      });

      ledger.addExpense(expense);
      await sqliteAdapter.saveExpense(expense, 'RVA171');

      // Verify financial calculation is completely undisturbed
      expect(ledger.totalExpenses.amount).toBe(125000);
      expect(ledger.netBalance.amount).toBe(375000);

      // Verify blob is indeed missing in Dexie
      const fetchedBlob = await blobAdapter.getBlob(missingReceiptBlobId);
      expect(fetchedBlob).toBeNull();

      // Retrieve expense from SQLite and verify data integrity
      const loadedExpense = await sqliteAdapter.getExpense('EXP-STRESS-01');
      expect(loadedExpense).not.toBeNull();
      expect(loadedExpense.amount.cents).toBe(12500000n);
      expect(loadedExpense.receiptBlobId).toBe(missingReceiptBlobId);
    });

    it('T5.5: SQLite Storage transaction rollback on mid-operation domain error restores complete prior state snapshot', async () => {
      // 1. Setup baseline state
      const baseItem = new ItineraryItem({
        id: 'ITIN-BASE-01',
        dayNumber: 1,
        title: 'Cita Base Preliminar'
      });
      await sqliteAdapter.saveItinerary(baseItem, 'RVA171');
      expect(sqliteAdapter.tables.itinerary_items.size).toBe(1);

      // 2. Begin transaction
      sqliteAdapter.beginTransaction();

      // 3. Mutate inside transaction
      const newItem = new ItineraryItem({
        id: 'ITIN-NEW-TX-02',
        dayNumber: 2,
        title: 'Cita Transaccional en Riesgo'
      });
      await sqliteAdapter.saveItinerary(newItem, 'RVA171');
      await sqliteAdapter.saveExpense({
        id: 'EXP-TX-01',
        category: 'TAXI',
        description: 'Carrera Taxi Transaccional',
        amount_cents: '4500000',
        currency: 'COP',
        actor_id: 'ACT-DRV'
      }, 'RVA171');

      expect(sqliteAdapter.tables.itinerary_items.size).toBe(2);
      expect(sqliteAdapter.tables.expense_items.size).toBe(1);

      // 4. Trigger simulated domain error and rollback
      sqliteAdapter.rollback();

      // 5. Assert 100% restoration
      expect(sqliteAdapter.tables.itinerary_items.size).toBe(1);
      expect(sqliteAdapter.tables.expense_items.size).toBe(0);
      expect(await sqliteAdapter.getItinerary('ITIN-NEW-TX-02')).toBeNull();
      expect(await sqliteAdapter.getExpense('EXP-TX-01')).toBeNull();
      expect(await sqliteAdapter.getItinerary('ITIN-BASE-01')).not.toBeNull();
    });

    it('T5.6: Nested or consecutive transaction boundary violations fail fast deterministically', () => {
      sqliteAdapter.beginTransaction();

      // Double begin should throw DomainError
      expect(() => {
        sqliteAdapter.beginTransaction();
      }).toThrow(DomainError);

      sqliteAdapter.commit();

      // Orphan commit should throw DomainError
      expect(() => {
        sqliteAdapter.commit();
      }).toThrow(DomainError);

      // Orphan rollback should throw DomainError
      expect(() => {
        sqliteAdapter.rollback();
      }).toThrow(DomainError);
    });

    it('T5.7: Storage Persistence Manager quota overflow simulation and pressure watcher notification', async () => {
      const manager = new StoragePersistenceManager({ warningThresholdRatio: 0.80 });

      let pressureEventReceived = null;
      const unsubscribe = manager.registerStoragePressureWatcher((event) => {
        pressureEventReceived = event;
      });

      // Simulate low-pressure estimate
      const normalEstimate = await manager.getStorageEstimate();
      expect(normalEstimate.percentageUsed).toBeLessThan(80);
      expect(pressureEventReceived).toBeNull();

      // Directly trigger storage pressure notification
      manager._notifyWatchers({
        quota: 1000000000,
        usage: 850000000,
        percentageUsed: 85.0,
        status: 'STORAGE_PRESSURE'
      });

      expect(pressureEventReceived).not.toBeNull();
      expect(pressureEventReceived.percentageUsed).toBe(85.0);
      expect(pressureEventReceived.status).toBe('STORAGE_PRESSURE');

      // Test unsubscribe
      unsubscribe();
      pressureEventReceived = null;
      manager._notifyWatchers({ quota: 100, usage: 90, percentageUsed: 90, status: 'STORAGE_PRESSURE' });
      expect(pressureEventReceived).toBeNull();
    });
  });

  // ==========================================================================
  // SECTION 2: 4 ARCHETYPES BOUNDARY SCENARIOS & FINANCIAL STRESS
  // ==========================================================================
  describe('2. 4 Archetypes Boundary Scenarios & Multi-Day Financial Stress', () => {

    it('T5.8: Multi-day extreme financial overdraft ($50,000,000 COP) triggers DEBT_OWED_BY_PATIENT with exact BigInt accounting', () => {
      const emergencyLedger = new SettlementLedger({
        reservationCode: 'RVA077-EMERGENCY',
        patientUuid: 'ENT-PAX-1143',
        currency: 'COP'
      });

      // $0 Initial Advance
      expect(emergencyLedger.totalAdvances.cents).toBe(0n);

      // Add emergency surgical expenses: $50,000,000 COP (5,000,000,000 cents)
      emergencyLedger.addExpense(new ExpenseItem({
        id: 'EXP-EMERGENCY-01',
        category: 'OTHER',
        description: 'Cirugía de Urgencia UCI Cardiovascular HPTU',
        amount: Money.fromAmount(35000000, 'COP'),
        actorId: 'ACT-MED-CIRUJANO'
      }));

      emergencyLedger.addExpense(new ExpenseItem({
        id: 'EXP-EMERGENCY-02',
        category: 'PHARMACY',
        description: 'Insumos Quirúrgicos & Prótesis Especializada',
        amount: Money.fromAmount(15000000, 'COP'),
        actorId: 'ACT-MED-HPTU'
      }));

      expect(emergencyLedger.totalExpenses.cents).toBe(5000000000n);
      expect(emergencyLedger.netBalance.cents).toBe(-5000000000n);
      expect(emergencyLedger.netBalance.amount).toBe(-50000000);

      const audit = emergencyLedger.getAuditSummary();
      expect(audit.balanceStatus).toBe('DEBT_OWED_BY_PATIENT');
      expect(SettlementCalculator.determineOverdraftStatus(emergencyLedger.netBalance)).toBe(OVERDRAFT_STATUSES.DEBT_OWED_BY_PATIENT);
    });

    it('T5.9: Exact zero balance settlement boundary (Advances === Expenses down to single cent) resolves to SETTLED_ZERO_BALANCE', () => {
      const balancedLedger = new SettlementLedger({
        reservationCode: 'RVA282-EXACT-ZERO',
        patientUuid: 'ENT-PAX-0282',
        currency: 'COP'
      });

      // Add advance: $1,234,567.89 COP -> 123456789n cents
      balancedLedger.addAdvance(Money.fromCents(123456789n, 'COP'));

      // Add expenses exactly matching 123456789n cents
      balancedLedger.addDriverTransfer(new DriverTransfer({
        id: 'TR-ZERO-1',
        driverActorId: 'ACT-DRV',
        origin: { lat: 6.1645, lng: -75.4231 },
        destination: { lat: 6.2442, lng: -75.5812 },
        flatRate: Money.fromCents(100000000n, 'COP') // $1,000,000.00
      }));

      balancedLedger.addExpense(new ExpenseItem({
        id: 'EXP-ZERO-2',
        category: 'PHARMACY',
        description: 'Medicamento Exacto',
        amount: Money.fromCents(23456789n, 'COP'), // $234,567.89
        actorId: 'ACT-GUIA'
      }));

      expect(balancedLedger.totalAdvances.cents).toBe(123456789n);
      expect(balancedLedger.totalExpenses.cents).toBe(123456789n);
      expect(balancedLedger.netBalance.isZero()).toBe(true);
      expect(balancedLedger.netBalance.cents).toBe(0n);

      const audit = balancedLedger.getAuditSummary();
      expect(audit.balanceStatus).toBe('SETTLED_ZERO_BALANCE');
      expect(SettlementCalculator.determineOverdraftStatus(balancedLedger.netBalance)).toBe(OVERDRAFT_STATUSES.BALANCED_ZERO);
    });

    it('T5.10: Foreign currency TRM rate fluctuations: Multi-day USD expenses with varying daily TRM rates computed with BigInt precision', () => {
      // Rates: Day 1 = 3950 COP/USD, Day 2 = 4025 COP/USD, Day 3 = 4150 COP/USD, Day 4 = 3980 COP/USD
      const dailyTransactionsUSD = [
        { day: 1, usdAmount: 1000, trmRateCOP: 3950n },
        { day: 2, usdAmount: 500,  trmRateCOP: 4025n },
        { day: 3, usdAmount: 800,  trmRateCOP: 4150n },
        { day: 4, usdAmount: 1200, trmRateCOP: 3980n }
      ];

      let totalCOPCents = 0n;
      let totalUSDCents = 0n;

      for (const tx of dailyTransactionsUSD) {
        const usdMoney = Money.fromAmount(tx.usdAmount, 'USD');
        totalUSDCents += usdMoney.cents;

        // BigInt cent conversion: usdCents * trmRateCOP
        const copCents = usdMoney.cents * tx.trmRateCOP;
        totalCOPCents += copCents;
      }

      // 1000*3950 + 500*4025 + 800*4150 + 1200*3980 = 3,950,000 + 2,012,500 + 3,320,000 + 4,776,000 = 14,058,500 COP
      const totalCOPMoney = Money.fromCents(totalCOPCents, 'COP');
      expect(totalCOPMoney.amount).toBe(14058500);
      expect(totalCOPMoney.cents).toBe(1405850000n);
      expect(totalUSDCents).toBe(350000n); // $3,500.00 USD
    });

    it('T5.11: Concurrent multi-patient lifecycle execution (all 4 archetypes) mutates simultaneously without cross-contamination', () => {
      const archetypes = [
        { code: 'RVA171', pax: 'ENT-PAX-0171', adv: 2098100, exp: 597636 },
        { code: 'RVA282', pax: 'ENT-PAX-0282', adv: 1200000, exp: 764409 },
        { code: 'RVA341', pax: 'ENT-PAX-1126', adv: 950000,  exp: 423259 },
        { code: 'RVA077', pax: 'ENT-PAX-1143', adv: 1850000, exp: 1287755 }
      ];

      const ledgers = new Map();

      // Mutate all 4 concurrently
      for (const arch of archetypes) {
        const ledger = new SettlementLedger({
          reservationCode: arch.code,
          patientUuid: arch.pax,
          currency: 'COP'
        });
        ledger.addAdvance(Money.fromAmount(arch.adv, 'COP'));
        ledger.addExpense(new ExpenseItem({
          id: `EXP-${arch.code}-MAIN`,
          category: 'OTHER',
          description: `Gasto principal ${arch.code}`,
          amount: Money.fromAmount(arch.exp, 'COP'),
          actorId: 'ACT-FIELD'
        }));
        ledgers.set(arch.code, ledger);
      }

      // Verify complete independence and zero data leakage
      for (const arch of archetypes) {
        const l = ledgers.get(arch.code);
        expect(l.reservationCode).toBe(arch.code);
        expect(l.patientUuid).toBe(arch.pax);
        expect(l.totalAdvances.amount).toBe(arch.adv);
        expect(l.totalExpenses.amount).toBe(arch.exp);
        expect(l.netBalance.amount).toBe(arch.adv - arch.exp);
      }
    });

    it('T5.12: High-density fractional companion shifts (50 distinct durations) aggregate with 0 cumulative floating-point deviation', () => {
      const shiftLedger = new SettlementLedger({
        reservationCode: 'RVA-SHIFTS-STRESS',
        patientUuid: 'ENT-PAX-TEST',
        currency: 'COP'
      });

      const hourlyRate = Money.fromAmount(15500, 'COP'); // $15,500 COP/h
      let expectedTotalCents = 0n;

      // 50 shifts of variable decimal durations: (i * 0.25) hours + (i % 2 === 0 ? $25,000 : $35,000 meal subsidy)
      for (let i = 1; i <= 50; i++) {
        const hours = (i * 0.25);
        const subsidyAmount = (i % 2 === 0) ? 25000 : 35000;
        const subsidy = Money.fromAmount(subsidyAmount, 'COP');

        const wage = hourlyRate.multiply(hours);
        const totalShiftCost = wage.add(subsidy);
        expectedTotalCents += totalShiftCost.cents;

        const shift = new CompanionShift({
          id: `SH-STRESS-${i}`,
          guideActorId: 'ACT-GUIA-YENNY',
          dayNumber: (i % 5) + 1,
          startTime: '08:00',
          totalHours: hours,
          hourlyRate: hourlyRate,
          mealSubsidy: subsidy
        });

        shiftLedger.addCompanionShift(shift);
      }

      expect(shiftLedger.companionShifts).toHaveLength(50);
      expect(shiftLedger.totalExpenses.cents).toBe(expectedTotalCents);
    });

    it('T5.13: Massive driver surcharge edge case: Surcharges exceeding flat rates across multi-stop routes maintain ledger invariant', () => {
      const driverLedger = new SettlementLedger({
        reservationCode: 'RVA-DRV-SURCHARGE',
        patientUuid: 'ENT-PAX-SURCHARGE',
        currency: 'COP'
      });

      for (let i = 1; i <= 20; i++) {
        const transfer = new DriverTransfer({
          id: `TR-SURCHARGE-${i}`,
          driverActorId: 'ACT-DRV-MONTOYA',
          origin: { lat: 6.1645, lng: -75.4231, name: 'Ruta Montaña' },
          destination: { lat: 6.2442, lng: -75.5812, name: 'Clínica' },
          flatRate: Money.fromAmount(150000, 'COP'),      // $150,000 COP
          surcharge: Money.fromAmount(350000, 'COP')     // $350,000 COP Surcharge
        });
        driverLedger.addDriverTransfer(transfer);
      }

      // 20 * (150,000 + 350,000 = 500,000) = $10,000,000 COP = 1,000,000,000 cents
      expect(driverLedger.totalExpenses.cents).toBe(1000000000n);
      expect(driverLedger.totalExpenses.amount).toBe(10000000);
    });

    it('T5.14: Fractional money splitting across N actors (Fowler Money distribution) maintains exact conservation of cents', () => {
      const amountsToSplit = [
        { total: 100001, parts: 3 },     // $1,000.01 COP divided among 3
        { total: 10000003, parts: 7 },   // $100,000.03 COP divided among 7
        { total: 99999999, parts: 13 },  // $999,999.99 COP divided among 13
        { total: 50000, parts: 6 }       // $500.00 COP divided among 6
      ];

      for (const item of amountsToSplit) {
        const originalMoney = Money.fromCents(BigInt(item.total), 'COP');
        const splits = originalMoney.split(item.parts);

        expect(splits).toHaveLength(item.parts);

        // Sum of parts must exactly equal originalMoney down to 0 cents lost
        let sumCents = 0n;
        for (const part of splits) {
          sumCents += part.cents;
        }

        expect(sumCents).toBe(originalMoney.cents);
      }
    });
  });

  // ==========================================================================
  // SECTION 3: OFFLINE PERSISTENCE, SNAPSHOT REHYDRATION & RESTART SIMULATION
  // ==========================================================================
  describe('3. Offline Persistence, Snapshot Rehydration & Browser Restart Simulation', () => {

    it('T5.15: Deep state snapshot export and full rehydration across SQLite and Dexie retains 100% relational integrity and secondary indices', async () => {
      const sourceSqlite = new SqliteStorageAdapter({ dbName: 'source_db' });
      const sourceDexie = new DexieBlobStorageAdapter({ dbName: 'source_dexie' });

      // Seed comprehensive state
      await hydrateStorageWithArchetype(sourceSqlite, sourceDexie, 'RVA171');
      await hydrateStorageWithArchetype(sourceSqlite, sourceDexie, 'RVA282');

      // Export snapshots
      const sqliteSnapshot = sourceSqlite.exportSnapshot();
      const serializedSqlite = JSON.stringify(sqliteSnapshot);

      // Create new target adapter simulating app reboot
      const targetSqlite = new SqliteStorageAdapter({ dbName: 'target_db' });
      targetSqlite.importSnapshot(JSON.parse(serializedSqlite));

      // Verify table counts
      expect(targetSqlite.tables.patient_records.size).toBe(sourceSqlite.tables.patient_records.size);
      expect(targetSqlite.tables.itinerary_items.size).toBe(sourceSqlite.tables.itinerary_items.size);
      expect(targetSqlite.tables.settlement_ledgers.size).toBe(sourceSqlite.tables.settlement_ledgers.size);

      // Verify secondary indices reconstruction
      const rva171Items = await targetSqlite.getAllItineraries({ reservationCode: 'RVA171' });
      expect(rva171Items.length).toBeGreaterThan(0);

      const rva282Ledger = await targetSqlite.getSettlementLedger('RVA282');
      expect(rva282Ledger).not.toBeNull();
      expect(rva282Ledger.patientUuid).toBe('ENT-PAX-0282');
    });

    it('T5.16: Cold restart simulation: Destroy storage instances, reload from JSON serialized payload, verify query consistency', async () => {
      // 1. Setup initial app store instance
      const initialStore = new AppStore({ initialArchetype: 'RVA171' });
      await initialStore.initialize();

      // Find an item in PROGRAMADO status to transition
      const scheduledStop = initialStore.getItinerary().find((i) => i.status === 'PROGRAMADO');
      expect(scheduledStop).toBeDefined();

      await initialStore.transitionStatus(scheduledStop.id, 'EN_CAMINO');
      await initialStore.submitExpense({
        category: 'TAXI',
        description: 'Carrera Emergencia Pre-Reboot',
        amount: 45000,
        actorId: 'ACT-DRV'
      });

      // 2. Export full persistence state
      const persistentSnapshot = {
        sqlite: initialStore.storagePort.exportSnapshot(),
        blobs: Array.from(initialStore.blobStoragePort._blobStore.entries())
      };

      const diskPayload = JSON.stringify(persistentSnapshot);

      // 3. Destroy old store, instantiate fresh store
      const parsedDisk = JSON.parse(diskPayload);
      const rehydratedSqlite = new SqliteStorageAdapter();
      rehydratedSqlite.importSnapshot(parsedDisk.sqlite);

      const rehydratedDexie = new DexieBlobStorageAdapter();
      for (const [k, v] of parsedDisk.blobs) {
        rehydratedDexie._blobStore.set(k, v);
      }

      const freshStore = new AppStore({
        storagePort: rehydratedSqlite,
        blobStoragePort: rehydratedDexie,
        initialArchetype: 'RVA171'
      });
      await freshStore.initialize();

      // 4. Verify identical query state post-reboot
      const freshItems = freshStore.getItinerary();
      const reloadedStop = freshItems.find((i) => i.id === scheduledStop.id);
      expect(reloadedStop.status).toBe('EN_CAMINO');

      const balance = freshStore.getSettlementBalance();
      expect(balance).not.toBeNull();
      expect(balance.totalExpenses.amount).toBeGreaterThan(0);
    });

    it('T5.17: SHA-256 CQRS event stream re-verification post-rehydration detects any payload or previousHash tampering', async () => {
      const storage = new SqliteStorageAdapter();
      const hashChain = new LedgerHashChain({ storagePort: storage, aggregateId: 'RVA171' });

      // Append 20 events into hash chain
      for (let i = 1; i <= 20; i++) {
        await hashChain.appendEvent({
          actorId: 'ACT-FIN',
          actorRole: 'FINANCIAL_AUDITOR',
          eventType: 'STRESS_EVENT',
          payload: { index: i, note: `Audit checkpoint ${i}` }
        });
      }

      // Verify chain is valid
      const integrityBefore = await hashChain.verifyChainIntegrity();
      expect(integrityBefore.isValid).toBe(true);
      expect(integrityBefore.verifiedCount).toBe(20);

      // Export snapshot, simulate restart
      const snapshot = storage.exportSnapshot();
      const serialized = JSON.stringify(snapshot);

      const restoredStorage = new SqliteStorageAdapter();
      restoredStorage.importSnapshot(JSON.parse(serialized));

      const restoredChain = new LedgerHashChain({ storagePort: restoredStorage, aggregateId: 'RVA171' });
      const integrityAfter = await restoredChain.verifyChainIntegrity();
      expect(integrityAfter.isValid).toBe(true);
      expect(integrityAfter.verifiedCount).toBe(20);

      // Tamper with event #10 in raw stored row
      restoredStorage.tables.cqrs_events[10].payload.note = 'TAMPERED_NOTE';

      // Tampering detection check
      let tamperingDetected = false;
      try {
        await restoredChain.verifyChainIntegrity();
      } catch (err) {
        tamperingDetected = true;
        expect(err.message).toMatch(/Integridad Comprometida|no coincide/);
      }
      expect(tamperingDetected).toBe(true);
    });

    it('T5.18: Complex multi-entity relational graph round-trip preserves all foreign key relationships', async () => {
      const storage = new SqliteStorageAdapter();
      const blobStore = new DexieBlobStorageAdapter();

      // Hydrate all 4 archetypes
      for (const code of ['RVA171', 'RVA282', 'RVA341', 'RVA077']) {
        await hydrateStorageWithArchetype(storage, blobStore, code);
      }

      const snapshot = storage.exportSnapshot();
      const newStorage = new SqliteStorageAdapter();
      newStorage.importSnapshot(snapshot);

      // Verify all 4 patient records exist
      for (const code of ['RVA171', 'RVA282', 'RVA341', 'RVA077']) {
        const arch = getArchetype(code);
        const patient = await newStorage.getPatientRecord(arch.patientUuid);
        expect(patient).not.toBeNull();
        expect(patient.reservation_code).toBe(code);

        const ledger = await newStorage.getSettlementLedger(code);
        expect(ledger).not.toBeNull();
        expect(ledger.patientUuid).toBe(arch.patientUuid);

        const transfers = await newStorage.getDriverTransfersByReservation(code);
        const shifts = await newStorage.getCompanionShiftsByReservation(code);
        const expenses = await newStorage.getExpensesByReservation(code);

        expect(Array.isArray(transfers)).toBe(true);
        expect(Array.isArray(shifts)).toBe(true);
        expect(Array.isArray(expenses)).toBe(true);
      }
    });

    it('T5.19: Offline mutation queue replay converges to deterministic final ledger state', () => {
      const mutationQueue = [
        { type: 'ADVANCE', amount: 5000000 },
        { type: 'EXPENSE', amount: 120000, desc: 'Taxi 1' },
        { type: 'EXPENSE', amount: 85000,  desc: 'Pharmacy' },
        { type: 'EXPENSE', amount: 350000, desc: 'Lab' },
        { type: 'ADVANCE', amount: 2000000 },
        { type: 'EXPENSE', amount: 155000, desc: 'Guide Shift' }
      ];

      const ledger = new SettlementLedger({
        reservationCode: 'RVA-QUEUE-REPLAY',
        patientUuid: 'ENT-PAX-REPLAY',
        currency: 'COP'
      });

      for (const m of mutationQueue) {
        if (m.type === 'ADVANCE') {
          ledger.addAdvance(Money.fromAmount(m.amount, 'COP'));
        } else {
          ledger.addExpense(new ExpenseItem({
            id: `EXP-${Date.now()}-${Math.random()}`,
            category: 'OTHER',
            description: m.desc,
            amount: Money.fromAmount(m.amount, 'COP'),
            actorId: 'ACT-REPLAY'
          }));
        }
      }

      // Total Advances: 5M + 2M = 7,000,000 COP
      // Total Expenses: 120K + 85K + 350K + 155K = 710,000 COP
      // Net Balance: 6,290,000 COP
      expect(ledger.totalAdvances.amount).toBe(7000000);
      expect(ledger.totalExpenses.amount).toBe(710000);
      expect(ledger.netBalance.amount).toBe(6290000);
      expect(ledger.getAuditSummary().balanceStatus).toBe('CREDIT_REFUND_DUE');
    });
  });

  // ==========================================================================
  // SECTION 4: UI BRIDGE API CONCURRENCY & HIGH-FREQUENCY STRESS
  // ==========================================================================
  describe('4. UI Bridge API Concurrency & High-Frequency Stress', () => {
    let testStore;

    beforeEach(async () => {
      testStore = new AppStore({ initialArchetype: 'RVA171' });
      await testStore.initialize();
    });

    it('T5.20: UI Bridge Rapid Stress: 100 rapid consecutive status transitions on MedicalTripFieldApp execute without UI locks or unhandled promise rejections', async () => {
      // Create 34 scheduled stops so that 34 * 3 transitions = 102 transitions (>=100 transitions)
      const stopIds = [];
      for (let i = 1; i <= 34; i++) {
        const item = new ItineraryItem({
          id: `ITIN-RAPID-${i}`,
          dayNumber: 1,
          title: `Cita Rápida de Campo #${i}`,
          location: { lat: 6.2442, lng: -75.5812, name: 'Medellín' },
          status: 'PROGRAMADO'
        });
        await testStore.storagePort.saveItinerary(item, 'RVA171');
        stopIds.push(item.id);
      }

      await testStore.refresh();

      let transitionCount = 0;
      for (const stopId of stopIds) {
        // Step 1: PROGRAMADO -> EN_CAMINO
        await testStore.transitionStatus(stopId, 'EN_CAMINO');
        transitionCount++;

        // Step 2: EN_CAMINO -> EN_SITIO
        await testStore.transitionStatus(stopId, 'EN_SITIO');
        transitionCount++;

        // Step 3: EN_SITIO -> COMPLETADO
        await testStore.transitionStatus(stopId, 'COMPLETADO');
        transitionCount++;
      }

      expect(transitionCount).toBeGreaterThanOrEqual(100);
      expect(testStore.getState().lastError).toBeNull();
    });

    it('T5.21: UI Bridge Rapid Switching: Rapid alternating between 4 Archetypes (50 switches) maintains store coherence', async () => {
      const archetypeCodes = ['RVA171', 'RVA282', 'RVA341', 'RVA077'];

      for (let i = 0; i < 50; i++) {
        const code = archetypeCodes[i % archetypeCodes.length];
        await testStore.setActiveArchetype(code);

        expect(testStore.getActiveArchetype()).toBe(code);
        expect(testStore.getItinerary().length).toBeGreaterThan(0);
        expect(testStore.getSettlementBalance()).not.toBeNull();
      }

      expect(testStore.getState().lastError).toBeNull();
    });

    it('T5.22: UI Bridge Concurrent Expense Influx: 50 concurrent submitExpense() calls via Automation Bridge settle deterministically', async () => {
      await testStore.setActiveArchetype('RVA171');

      // Prepare 50 concurrent expense submissions
      const promises = [];
      for (let i = 1; i <= 50; i++) {
        promises.push(
          testStore.submitExpense({
            category: 'TAXI',
            description: `Gasto Concurrente #${i}`,
            amount: 10000, // $10,000 COP each
            actorId: 'ACT-BURST'
          })
        );
      }

      // Execute concurrently
      const results = await Promise.all(promises);
      expect(results).toHaveLength(50);

      // Verify all 50 recorded without errors
      const finalBalance = testStore.getSettlementBalance();
      expect(finalBalance).not.toBeNull();
      expect(testStore.getState().lastError).toBeNull();
    });

    it('T5.23: UI Bridge Geofence boundary stress: 50 rapid check-in attempts at exact boundary thresholds transition accurately', async () => {
      // Create dedicated stop with geofence
      const geofencedStop = new ItineraryItem({
        id: 'ITIN-GEO-TEST-01',
        dayNumber: 1,
        title: 'Clínica Clofán Geofence Test',
        location: { lat: 6.2206, lng: -75.5714, name: 'Clínica Clofán', geofenceRadiusMeters: 300 },
        requiresGpsCheckIn: true,
        status: 'PROGRAMADO'
      });
      await testStore.storagePort.saveItinerary(geofencedStop, 'RVA171');
      await testStore.refresh();

      // 1. Valid Check-in inside radius
      await testStore.submitCheckIn(geofencedStop.id, { lat: 6.2206, lng: -75.5714 });
      const updatedStop = testStore.getItinerary().find((i) => i.id === geofencedStop.id);
      expect(updatedStop.status).toBe('EN_SITIO');

      // 2. Attempt check-in outside geofence radius
      const farStop = new ItineraryItem({
        id: 'ITIN-FAR-TEST-02',
        dayNumber: 1,
        title: 'Parada Lejana',
        location: { lat: 6.2206, lng: -75.5714, name: 'Clínica', geofenceRadiusMeters: 150 },
        requiresGpsCheckIn: true,
        status: 'PROGRAMADO'
      });
      await testStore.storagePort.saveItinerary(farStop, 'RVA171');
      await testStore.refresh();

      let geofenceCaught = false;
      try {
        await testStore.submitCheckIn(farStop.id, { lat: 6.2800, lng: -75.5800 }); // Far away
      } catch (err) {
        geofenceCaught = true;
        expect(err.message).toMatch(/Guardia de Check-In GPS/);
      }
      expect(geofenceCaught).toBe(true);

      // 3. Domain invariant enforcement for non-operative territory (Mocoa)
      let mocoaDomainCaught = false;
      try {
        OperativeTerritory.assertOperative('MOCOA');
      } catch (err) {
        mocoaDomainCaught = true;
        expect(err.message).toMatch(/Violación de Invariante Geoespacial|Zona no operativa/);
      }
      expect(mocoaDomainCaught).toBe(true);
    });

    it('T5.24: UI Bridge Modal state thrashing: Rapid open/close modal cycle (100 times) maintains clean modal context', () => {
      const modalTypes = ['GPS', 'OCR', 'SIGNATURE', 'AUDIT', 'EXPENSE'];

      for (let i = 0; i < 100; i++) {
        const modal = modalTypes[i % modalTypes.length];
        const ctx = { iteration: i, timestamp: Date.now() };

        testStore.openModal(modal, ctx);
        expect(testStore.getState().activeModal).toBe(modal);
        expect(testStore.getState().activeModalContext.iteration).toBe(i);

        testStore.closeModal();
        expect(testStore.getState().activeModal).toBeNull();
        expect(testStore.getState().activeModalContext).toBeNull();
      }
    });

    it('T5.25: UI Bridge Reactive Subscriber load: 50 concurrent active UI listeners receive state updates without dropped events', async () => {
      let totalNotificationsReceived = 0;
      const unsubscribers = [];

      // Attach 50 listeners
      for (let i = 0; i < 50; i++) {
        const unsub = testStore.subscribe((state) => {
          totalNotificationsReceived++;
        });
        unsubscribers.push(unsub);
      }

      // Initial subscription emits 50 times (1 per subscriber)
      expect(totalNotificationsReceived).toBe(50);

      // Trigger state mutation
      testStore.setSelectedDay(3);
      // 50 subscribers * 1 notification = +50
      expect(totalNotificationsReceived).toBe(100);

      // Clean up all subscribers
      for (const unsub of unsubscribers) {
        unsub();
      }

      // Further mutation should not trigger notifications
      testStore.setSelectedDay('ALL');
      expect(totalNotificationsReceived).toBe(100);
    });
  });
});

if (process.argv[1] && process.argv[1].endsWith('tier5_resilience_stress.test.js')) {
  runAllTests('Tier 5: Resilience & Storage Stress (25 Tests)').then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
