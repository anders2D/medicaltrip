import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto'; // Polyfill IndexedDB for Node.js Vitest environment
import { DexieMedicalTripDB } from '../../../src/infrastructure/storage/DexieMedicalTripDB';
import { DexieItineraryRepository } from '../../../src/infrastructure/storage/DexieItineraryRepository';
import { StoragePersistAdapter } from '../../../src/infrastructure/storage/StoragePersistAdapter';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import { Booking } from '../../../src/domain/entities/Booking';
import { ItineraryMilestone } from '../../../src/domain/entities/ItineraryMilestone';
import { FinancialTransaction } from '../../../src/domain/entities/FinancialTransaction';
import { Money } from '../../../src/domain/values/Money';
import { OperativeTerritory } from '../../../src/domain/values/OperativeTerritory';
import { Coordinates } from '../../../src/domain/values/Coordinates';

describe('Integration Test: Dexie.js Local-First Storage & Repositories', () => {
  let db: DexieMedicalTripDB;
  let repository: DexieItineraryRepository;
  let persistAdapter: StoragePersistAdapter;

  beforeEach(async () => {
    // Unique in-memory db name per test run for absolute test isolation
    const testDbName = `TestMedicalTripDB_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db = new DexieMedicalTripDB(testDbName);
    repository = new DexieItineraryRepository(db);
    persistAdapter = new StoragePersistAdapter();
    await db.open();
  });

  afterEach(async () => {
    if (db && db.isOpen()) {
      await db.delete();
    }
  });

  it('1. Initializes Dexie schema with all 6 required tables', async () => {
    expect(db.itineraries).toBeDefined();
    expect(db.milestones).toBeDefined();
    expect(db.transactions).toBeDefined();
    expect(db.binaryBlobs).toBeDefined();
    expect(db.auditLedger).toBeDefined();
    expect(db.syncState).toBeDefined();

    const count = await db.itineraries.count();
    expect(count).toBe(0);
  });

  it('2. Persists and hydrates full MedicalItinerary aggregate with exact BigInt cents', async () => {
    const booking = new Booking({
      id: 'bkg-rva171',
      code: 'RVA171-4',
      patientId: 'ENT-PAX-0171',
      paxCount: 2,
      arrivalDate: '2026-08-25T10:00:00.000Z',
      departureDate: '2026-08-30T18:00:00.000Z',
      arrivalAirline: 'Avianca',
      arrivalFlight: 'AV 093',
      hotelName: 'Hotel Inntu Laureles',
      status: 'PROGRAMADO',
    });

    const m1 = new ItineraryMilestone({
      id: 'ms-01',
      reservaId: 'RVA171-4',
      dayNumber: 1,
      title: 'Llegada y Traslado Aeropuerto JMC a Hotel',
      category: 'FLIGHT',
      startDateTime: '2026-08-25T10:30:00.000Z',
      endDateTime: '2026-08-25T11:45:00.000Z',
      location: new OperativeTerritory('Aeropuerto JMC Rionegro'),
      coordinates: new Coordinates(6.1645, -75.4278),
      financialType: 'FLEET_TAXI',
      cost: Money.fromAmount(160000, 'COP'),
      assignedDriverId: 'DRV-001-CARLOS',
      status: 'PROGRAMADO',
    });

    const m2 = new ItineraryMilestone({
      id: 'ms-02',
      reservaId: 'RVA171-4',
      dayNumber: 2,
      title: 'Valoración Quirúrgica Clínica CIMA',
      category: 'CLINICAL',
      startDateTime: '2026-08-26T08:00:00.000Z',
      endDateTime: '2026-08-26T16:00:00.000Z',
      location: new OperativeTerritory('Clínica CIMA El Poblado'),
      financialType: 'GUIDE_FEE',
      guideHours: 8,
      cost: Money.fromAmount(159000, 'COP'), // 8h * 15.5k + 35k meal
      assignedGuideId: 'GUIA-001-VALENTINA',
      status: 'PROGRAMADO',
    });

    const itinerary = new MedicalItinerary({
      booking,
      milestones: [m1, m2],
      defaultCurrency: 'COP',
    });

    // Add financial transactions: Advance and pharmacy expense
    itinerary.recordCashAdvance(
      Money.fromAmount(500000, 'COP'),
      'Anticipo en efectivo recibido a la llegada',
      '2026-08-25T11:00:00.000Z'
    );

    itinerary.recordOutOfPocketExpense(
      'Gotas Oftálmicas y Gasas Cruz Verde',
      Money.fromAmount(85000, 'COP'),
      { milestoneId: 'ms-02', receiptUuid: 'rcpt-uuid-777' }
    );

    // Save aggregate
    await repository.save(itinerary);

    // Hydrate aggregate by booking ID and by Code
    const loadedById = await repository.getById('bkg-rva171');
    const loadedByCode = await repository.getByBookingCode('RVA171-4');

    expect(loadedById).not.toBeNull();
    expect(loadedByCode).not.toBeNull();

    expect(loadedById!.code).toBe('RVA171-4');
    expect(loadedById!.patientId).toBe('ENT-PAX-0171');
    expect(loadedById!.milestones.length).toBe(2);
    expect(loadedById!.transactions.length).toBe(4); // 2 auto-generated from milestones + 1 cash advance + 1 out of pocket

    // Verify milestone details
    const loadedM1 = loadedById!.getMilestoneOrThrow('ms-01');
    expect(loadedM1.title).toBe('Llegada y Traslado Aeropuerto JMC a Hotel');
    expect(loadedM1.cost.amountInCents).toBe(16000000n);
    expect(loadedM1.cost.format()).toBe('$ 160.000 COP');
    expect(loadedM1.coordinates).toBeDefined();
    expect(loadedM1.coordinates!.latitude).toBe(6.1645);

    // Verify Balance Sheet calculations match exactly
    const originalBalance = itinerary.calculateBalanceSheet();
    const loadedBalance = loadedById!.calculateBalanceSheet();

    expect(loadedBalance.totalExpenses.amountInCents).toBe(originalBalance.totalExpenses.amountInCents);
    expect(loadedBalance.totalCashAdvances.amountInCents).toBe(originalBalance.totalCashAdvances.amountInCents);
    expect(loadedBalance.netBalance.amountInCents).toBe(originalBalance.netBalance.amountInCents);
    expect(loadedBalance.netBalance.amountInCents).toBe(-9600000n); // (160k + 159k + 85k) - 500k = 404k - 500k = -96k COP
    expect(loadedBalance.isRefundDue).toBe(true);
  });

  it('3. Guarantees BigInt precision across extreme values and zero cent loss', async () => {
    const booking = new Booking({
      id: 'bkg-high-value',
      code: 'RVA999-1',
      patientId: 'ENT-PAX-9999',
      paxCount: 1,
      arrivalDate: '2026-09-01T00:00:00.000Z',
      departureDate: '2026-09-10T00:00:00.000Z',
      status: 'PROGRAMADO',
    });

    const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

    // Large transaction: 85,450,250.75 COP => 8545025075n cents
    const largeAmount = Money.fromCents(8545025075n, 'COP');
    itinerary.recordCashAdvance(largeAmount, 'Gran depósito internacional');

    // Small transaction: 100.50 COP => 10050n cents
    itinerary.recordOutOfPocketExpense('Parqueadero Hospital', Money.fromCents(10050n, 'COP'));

    await repository.save(itinerary);

    const reloaded = await repository.getById('bkg-high-value');
    expect(reloaded).not.toBeNull();

    const txs = reloaded!.transactions;
    expect(txs.length).toBe(2);

    const advTx = txs.find((t) => t.type === 'CASH_ADVANCE')!;
    expect(typeof advTx.amount.amountInCents).toBe('bigint');
    expect(advTx.amount.amountInCents).toBe(8545025075n);

    const expTx = txs.find((t) => t.type === 'OUT_OF_POCKET')!;
    expect(expTx.amount.amountInCents).toBe(10050n);
  });

  it('4. Updates milestone lifecycle and synchronizes changes in IndexedDB', async () => {
    const booking = new Booking({
      id: 'bkg-lifecycle',
      code: 'CTZ282-3',
      patientId: 'ENT-PAX-0282',
      paxCount: 1,
      arrivalDate: '2026-08-26T00:00:00.000Z',
      departureDate: '2026-08-31T00:00:00.000Z',
    });

    const m1 = new ItineraryMilestone({
      id: 'ms-trans-01',
      reservaId: 'CTZ282-3',
      dayNumber: 1,
      title: 'Toma de Muestras Cardio VID',
      category: 'LAB',
      startDateTime: '2026-08-26T07:00:00.000Z',
      endDateTime: '2026-08-26T08:00:00.000Z',
      location: 'Clínica Cardio VID Medellín',
      status: 'PROGRAMADO',
    });

    const itinerary = new MedicalItinerary({ booking, milestones: [m1] });
    await repository.save(itinerary);

    // Transition: PROGRAMADO -> EN_CAMINO -> EN_SITIO -> COMPLETADO
    itinerary.updateMilestoneStatus('ms-trans-01', 'EN_CAMINO');
    itinerary.updateMilestoneStatus('ms-trans-01', 'EN_SITIO', {
      coords: new Coordinates(6.2845, -75.5789),
    });
    itinerary.updateMilestoneStatus('ms-trans-01', 'COMPLETADO', {
      signatureUuid: 'sig-patient-282',
      receiptUuid: 'rcpt-lab-cardio',
    });

    await repository.save(itinerary);

    const reloaded = await repository.getById('bkg-lifecycle');
    const updatedM1 = reloaded!.getMilestoneOrThrow('ms-trans-01');

    expect(updatedM1.status).toBe('COMPLETADO');
    expect(updatedM1.gpsChecked).toBe(true);
    expect(updatedM1.signatureUuid).toBe('sig-patient-282');
    expect(updatedM1.receiptUuid).toBe('rcpt-lab-cardio');
  });

  it('5. Handles milestone removal and cascading deletion of itinerary', async () => {
    const booking = new Booking({
      id: 'bkg-del',
      code: 'RVA341-2',
      patientId: 'ENT-PAX-0341',
      paxCount: 1,
      arrivalDate: '2026-08-27T00:00:00.000Z',
      departureDate: '2026-08-30T00:00:00.000Z',
    });

    const m1 = new ItineraryMilestone({
      id: 'ms-keep',
      reservaId: 'RVA341-2',
      dayNumber: 1,
      title: 'Consulta Anestesiología',
      category: 'CLINICAL',
      startDateTime: '2026-08-27T09:00:00.000Z',
      location: 'Clínica Clofán Medellín',
    });

    const m2 = new ItineraryMilestone({
      id: 'ms-remove',
      reservaId: 'RVA341-2',
      dayNumber: 1,
      title: 'Tour Panorámico Cancelado',
      category: 'HOTEL',
      startDateTime: '2026-08-27T15:00:00.000Z',
      location: 'Medellín General',
    });

    const itinerary = new MedicalItinerary({ booking, milestones: [m1, m2] });
    await repository.save(itinerary);

    // Remove m2
    itinerary.removeMilestone('ms-remove');
    await repository.save(itinerary);

    const afterRemoval = await repository.getById('bkg-del');
    expect(afterRemoval!.milestones.length).toBe(1);
    expect(afterRemoval!.getMilestone('ms-remove')).toBeUndefined();

    // Cascading deletion
    await repository.delete('bkg-del');
    const afterDelete = await repository.getById('bkg-del');
    expect(afterDelete).toBeNull();

    const orphanMilestones = await db.milestones.where('reservaId').equals('RVA341-2').toArray();
    expect(orphanMilestones.length).toBe(0);
  });

  it('6. ILedgerRepository: appends standalone transactions and computes live balance sheets', async () => {
    const tx1 = new FinancialTransaction({
      id: 'tx-standalone-1',
      reservaId: 'RVA077-1',
      timestamp: '2026-08-28T09:00:00.000Z',
      type: 'FLEET_TAXI',
      amount: Money.fromAmount(160000, 'COP'),
      description: 'Transfer JMC',
    });

    const tx2 = new FinancialTransaction({
      id: 'tx-standalone-2',
      reservaId: 'RVA077-1',
      timestamp: '2026-08-28T14:00:00.000Z',
      type: 'OUT_OF_POCKET',
      amount: Money.fromAmount(95000, 'COP'),
      description: 'Farmacia Pasteur',
    });

    const tx3 = new FinancialTransaction({
      id: 'tx-standalone-3',
      reservaId: 'RVA077-1',
      timestamp: '2026-08-28T16:00:00.000Z',
      type: 'CASH_ADVANCE',
      amount: Money.fromAmount(300000, 'COP'),
      description: 'Anticipo Pax',
    });

    await repository.appendTransaction(tx1);
    await repository.appendTransaction(tx2);
    await repository.appendTransaction(tx3);

    const txList = await repository.getTransactions('RVA077-1');
    expect(txList.length).toBe(3);

    const balanceSheet = await repository.getBalanceSheet('RVA077-1');
    expect(balanceSheet).not.toBeNull();
    expect(balanceSheet!.totalFleetTaxis.amountInCents).toBe(16000000n);
    expect(balanceSheet!.totalOutOfPocket.amountInCents).toBe(9500000n);
    expect(balanceSheet!.totalCashAdvances.amountInCents).toBe(30000000n);
    expect(balanceSheet!.totalExpenses.amountInCents).toBe(25500000n);
    expect(balanceSheet!.netBalance.amountInCents).toBe(-4500000n); // 255k - 300k = -45k COP
    expect(balanceSheet!.isRefundDue).toBe(true);
  });

  it('7. Storing, querying, and retrieving binary blobs (Signatures & OCR Receipts)', async () => {
    const signatureBlob = {
      id: 'blob-sig-0171',
      category: 'SIGNATURE' as const,
      relatedId: 'RVA171-4',
      mimeType: 'image/png',
      data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      sizeBytes: 85,
      sha256Hash: 'mocksha256signaturehash',
      createdAt: new Date().toISOString(),
    };

    await repository.saveBlob(signatureBlob);

    const retrieved = await repository.getBlob('blob-sig-0171');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.category).toBe('SIGNATURE');
    expect(retrieved!.sizeBytes).toBe(85);
    expect(retrieved!.relatedId).toBe('RVA171-4');

    const relatedBlobs = await repository.getBlobsByRelatedId('RVA171-4');
    expect(relatedBlobs.length).toBe(1);

    await repository.deleteBlob('blob-sig-0171');
    const afterDelete = await repository.getBlob('blob-sig-0171');
    expect(afterDelete).toBeNull();
  });

  it('8. StoragePersistAdapter handles quota estimation and WebKit anti-eviction gracefully', async () => {
    const isPersisted = await persistAdapter.isStoragePersisted();
    expect(typeof isPersisted).toBe('boolean');

    const quotaInfo = await persistAdapter.getStorageQuota();
    expect(quotaInfo).toHaveProperty('usedBytes');
    expect(quotaInfo).toHaveProperty('totalBytes');
    expect(quotaInfo).toHaveProperty('quotaPct');

    const webKitResult = await persistAdapter.preventWebKitEviction();
    expect(typeof webKitResult).toBe('boolean');
  });
});
