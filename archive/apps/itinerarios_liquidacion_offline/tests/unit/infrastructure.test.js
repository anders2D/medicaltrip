import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DomainError,
  Money,
  LocationCoordinate,
  ActorEvent,
  ItineraryItem,
  SettlementLedger,
  ExpenseItem,
  DriverTransfer,
  CompanionShift,
  PatientSignature
} from '../../src/domain/index.js';

import {
  SqliteStorageAdapter,
  DexieBlobStorageAdapter,
  StoragePersistenceManager,
  SimulatedGeolocationAdapter,
  KNOWN_OPERATIONAL_LOCATIONS,
  CanvasSignatureAdapter,
  MockOCRAdapter,
  ARCHETYPES_DATA,
  getArchetype,
  getAllArchetypes,
  hydrateStorageWithArchetype
} from '../../src/infrastructure/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../../');

describe('Milestone 2 — Local-First Persistence & Hardware/Data Adapters Unit Tests', () => {

  // ==========================================================================
  // 1. SQLite Relational Storage Adapter (Tier 1 Persistence)
  // ==========================================================================
  describe('1. SQLite Relational Storage Adapter (Tier 1)', () => {
    let storage;

    beforeEach(() => {
      storage = new SqliteStorageAdapter({ dbName: 'test_medicaltrip_sqlite' });
    });

    it('initializes schema DDL and tables correctly', async () => {
      const res = await storage.initializeSchema();
      assert.equal(res.success, true);
      assert.ok(res.tablesCount >= 8);
      assert.ok(storage.isSchemaInitialized);
      assert.match(res.ddl, /CREATE TABLE IF NOT EXISTS itinerary_items/);
      assert.match(res.ddl, /CREATE TABLE IF NOT EXISTS settlement_ledgers/);
      assert.match(res.ddl, /CREATE TABLE IF NOT EXISTS cqrs_events/);
    });

    it('persists and retrieves ItineraryItem entity preserving domain methods and properties', async () => {
      const item = new ItineraryItem({
        id: 'ITN-SQL-001',
        dayNumber: 1,
        date: '2026-09-01',
        timeWindow: '08:00 - 10:00',
        title: 'Consulta Clofán Oftalmología',
        clinicName: 'Clínica Clofán',
        specialty: 'Oftalmología',
        location: { lat: 6.2206, lng: -75.5714, name: 'Clínica Clofán' },
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      });

      await storage.saveItinerary(item, 'RVA171');

      const retrieved = await storage.getItinerary('ITN-SQL-001');
      assert.ok(retrieved instanceof ItineraryItem);
      assert.equal(retrieved.id, 'ITN-SQL-001');
      assert.equal(retrieved.title, 'Consulta Clofán Oftalmología');
      assert.equal(retrieved.dayNumber, 1);
      assert.equal(retrieved.status, 'PROGRAMADO');
      assert.equal(retrieved.requiresGpsCheckIn, true);

      // Verify domain mutation on retrieved entity
      retrieved.startTransit('2026-09-01T07:30:00Z');
      assert.equal(retrieved.status, 'EN_CAMINO');
    });

    it('queries all itineraries with filtering by dayNumber and reservationCode', async () => {
      const item1 = new ItineraryItem({
        id: 'ITN-DAY1-1',
        dayNumber: 1,
        timeWindow: '08:00 - 09:30',
        title: 'Cita 1 Día 1',
        location: { lat: 6.2088, lng: -75.5678 }
      });
      const item2 = new ItineraryItem({
        id: 'ITN-DAY1-2',
        dayNumber: 1,
        timeWindow: '10:00 - 11:30',
        title: 'Cita 2 Día 1',
        location: { lat: 6.2206, lng: -75.5714 }
      });
      const item3 = new ItineraryItem({
        id: 'ITN-DAY2-1',
        dayNumber: 2,
        timeWindow: '09:00 - 10:00',
        title: 'Cita 1 Día 2',
        location: { lat: 6.2754, lng: -75.5684 }
      });

      await storage.saveItinerary(item1, 'RVA171');
      await storage.saveItinerary(item2, 'RVA171');
      await storage.saveItinerary(item3, 'RVA282');

      // Filter by day 1
      const day1Items = await storage.getAllItineraries(1);
      assert.equal(day1Items.length, 2);
      assert.equal(day1Items[0].id, 'ITN-DAY1-1');
      assert.equal(day1Items[1].id, 'ITN-DAY1-2');

      // Filter by object
      const rva171Items = await storage.getAllItineraries({ reservationCode: 'RVA171' });
      assert.equal(rva171Items.length, 2);

      const rva282Items = await storage.getAllItineraries({ reservationCode: 'RVA282' });
      assert.equal(rva282Items.length, 1);
      assert.equal(rva282Items[0].id, 'ITN-DAY2-1');
    });

    it('persists and retrieves CQRS events with SHA-256 hash chaining verification', async () => {
      const ev1 = new ActorEvent({
        eventId: 'EVT-001',
        actorId: 'DRV-RAMON',
        actorRole: 'DRIVER',
        eventType: 'TRANSFER_STARTED',
        aggregateId: 'RVA171',
        payload: { transferId: 'TRF-01' }
      });

      await storage.appendEvent(ev1);

      const ev2 = new ActorEvent({
        eventId: 'EVT-002',
        actorId: 'DRV-RAMON',
        actorRole: 'DRIVER',
        eventType: 'TRANSFER_COMPLETED',
        aggregateId: 'RVA171',
        payload: { transferId: 'TRF-01', costCents: '13000000' },
        previousHash: ev1.hash
      });

      await storage.appendEvent(ev2);

      const stream = await storage.getEventStream('RVA171');
      assert.equal(stream.length, 2);
      assert.equal(stream[0].eventId, 'EVT-001');
      assert.equal(stream[1].eventId, 'EVT-002');
      assert.equal(stream[1].previousHash, stream[0].hash);

      // Attempting to append broken hash chain throws DomainError
      const brokenEv = new ActorEvent({
        eventId: 'EVT-BROKEN',
        actorId: 'DRV-RAMON',
        actorRole: 'DRIVER',
        eventType: 'TRANSFER_FAILED',
        aggregateId: 'RVA171',
        payload: {},
        previousHash: 'invalid_broken_hash_00000000000000000000000000000000000000000000000'
      });

      await assert.rejects(() => storage.appendEvent(brokenEv), DomainError);
    });

    it('persists and reconstructs full SettlementLedger aggregate with child entities', async () => {
      const ledger = new SettlementLedger({
        reservationCode: 'RVA171',
        patientUuid: 'ENT-PAX-0171',
        currency: 'COP'
      });

      ledger.addAdvance(Money.fromAmount(2000000, 'COP'));

      ledger.addExpense(
        new ExpenseItem({
          id: 'EXP-SQL-01',
          category: 'PHARMACY',
          description: 'Droguería Pasteur Antibióticos',
          amount: Money.fromAmount(85000, 'COP'),
          actorId: 'GUIA-LILIANA'
        })
      );

      ledger.addDriverTransfer(
        new DriverTransfer({
          id: 'TRF-SQL-01',
          driverActorId: 'DRV-RAMON',
          origin: { lat: 6.1645, lng: -75.4278 },
          destination: { lat: 6.2088, lng: -75.5678 },
          flatRate: Money.fromAmount(130000, 'COP')
        })
      );

      ledger.addCompanionShift(
        new CompanionShift({
          id: 'SHF-SQL-01',
          guideActorId: 'GUIA-LILIANA',
          dayNumber: 1,
          startTime: '08:00',
          totalHours: 5,
          hourlyRate: Money.fromAmount(40000, 'COP'),
          mealSubsidy: Money.fromAmount(20000, 'COP')
        })
      );

      await storage.saveSettlementLedger(ledger);

      const loadedLedger = await storage.getSettlementLedger('RVA171');
      assert.ok(loadedLedger instanceof SettlementLedger);
      assert.equal(loadedLedger.reservationCode, 'RVA171');
      assert.equal(loadedLedger.totalAdvances.amount, 2000000);
      assert.equal(loadedLedger.totalExpenses.amount, 435000); // 85k + 130k + 220k
      assert.equal(loadedLedger.netBalance.amount, 1565000);
      assert.equal(loadedLedger.expenses.length, 1);
      assert.equal(loadedLedger.driverTransfers.length, 1);
      assert.equal(loadedLedger.companionShifts.length, 1);
    });

    it('supports transaction rollback and state restoration on error', async () => {
      const item = new ItineraryItem({
        id: 'ITN-TX-01',
        dayNumber: 1,
        title: 'Cita Previa Transacción',
        location: { lat: 6.2088, lng: -75.5678 }
      });
      await storage.saveItinerary(item);

      storage.beginTransaction();

      const itemTemp = new ItineraryItem({
        id: 'ITN-TX-TEMP',
        dayNumber: 1,
        title: 'Cita Temporal dentro de Transacción',
        location: { lat: 6.2088, lng: -75.5678 }
      });
      await storage.saveItinerary(itemTemp);

      assert.ok(await storage.getItinerary('ITN-TX-TEMP'));

      // Rollback
      storage.rollback();

      assert.equal(await storage.getItinerary('ITN-TX-TEMP'), null);
      assert.ok(await storage.getItinerary('ITN-TX-01'));
    });

    it('exports and imports complete database snapshots', async () => {
      const item = new ItineraryItem({
        id: 'ITN-SNAP-1',
        dayNumber: 1,
        title: 'Snapshot Test Item',
        location: { lat: 6.2088, lng: -75.5678 }
      });
      await storage.saveItinerary(item, 'RVA171');

      const snapshot = storage.exportSnapshot();
      assert.ok(snapshot.itinerary_items);

      const newStorage = new SqliteStorageAdapter({ dbName: 'restored_db' });
      newStorage.importSnapshot(snapshot);

      const restoredItem = await newStorage.getItinerary('ITN-SNAP-1');
      assert.ok(restoredItem);
      assert.equal(restoredItem.title, 'Snapshot Test Item');
    });
  });

  // ==========================================================================
  // 2. Dexie IndexedDB Blob Storage Adapter (Tier 2 Persistence)
  // ==========================================================================
  describe('2. Dexie IndexedDB Blob Storage Adapter (Tier 2)', () => {
    let blobAdapter;

    beforeEach(() => {
      blobAdapter = new DexieBlobStorageAdapter({ dbName: 'test_blobs_db' });
    });

    it('saves and retrieves binary receipt photo blobs by UUID with checksum', async () => {
      const fakeJpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const blobId = await blobAdapter.saveBlob('rec-blob-001', 'image/jpeg', fakeJpeg, {
        filename: 'recibo_cruz_verde.jpg',
        tags: ['receipt', 'pharmacy', 'RVA171']
      });

      assert.equal(blobId, 'rec-blob-001');

      const retrieved = await blobAdapter.getBlob('rec-blob-001');
      assert.ok(retrieved);
      assert.equal(retrieved.id, 'rec-blob-001');
      assert.equal(retrieved.mimeType, 'image/jpeg');
      assert.equal(retrieved.byteLength, 8);
      assert.ok(retrieved.checksum);
      assert.equal(retrieved.metadata.filename, 'recibo_cruz_verde.jpg');
    });

    it('stores and retrieves vector SVG digital signature strings', async () => {
      const svgData = '<svg viewBox="0 0 400 200"><path d="M10 20 L50 60" /></svg>';
      const blobId = await blobAdapter.saveBlob('sig-blob-001', 'image/svg+xml', svgData, {
        signerName: 'Catia Rodrigues'
      });

      const retrieved = await blobAdapter.getBlob(blobId);
      assert.equal(retrieved.mimeType, 'image/svg+xml');
      assert.equal(retrieved.data, svgData);
      assert.ok(retrieved.byteLength > 0);
    });

    it('handles blob existence check, deletion, and listing with filters', async () => {
      await blobAdapter.saveBlob('b1', 'image/png', 'PNGDATA1', { tags: ['tagA'] });
      await blobAdapter.saveBlob('b2', 'application/pdf', 'PDFDATA2', { tags: ['tagB'] });
      await blobAdapter.saveBlob('b3', 'image/png', 'PNGDATA3', { tags: ['tagA'] });

      assert.equal(await blobAdapter.hasBlob('b1'), true);
      assert.equal(await blobAdapter.hasBlob('b999'), false);

      const pngList = await blobAdapter.listBlobs({ mimeType: 'image/png' });
      assert.equal(pngList.length, 2);

      const tagBList = await blobAdapter.listBlobs({ tag: 'tagB' });
      assert.equal(tagBList.length, 1);
      assert.equal(tagBList[0].id, 'b2');

      await blobAdapter.deleteBlob('b1');
      assert.equal(await blobAdapter.hasBlob('b1'), false);
    });

    it('computes total storage size and exports Data URLs', async () => {
      await blobAdapter.saveBlob('b1', 'image/svg+xml', '<svg></svg>');
      const totalSize = await blobAdapter.getStorageSize();
      assert.ok(totalSize > 0);

      const dataUrl = await blobAdapter.exportBlobDataUrl('b1');
      assert.ok(dataUrl.startsWith('data:image/svg+xml'));
    });
  });

  // ==========================================================================
  // 3. Storage Persistence Manager (Tier 3 Local-First Protection)
  // ==========================================================================
  describe('3. Storage Persistence Manager (Tier 3 Protection)', () => {
    let persistenceManager;

    beforeEach(() => {
      persistenceManager = new StoragePersistenceManager();
    });

    it('evaluates persistence support and returns simulated or real persistence state', async () => {
      const res = await persistenceManager.requestPersistence();
      assert.equal(typeof res.persisted, 'boolean');
      assert.equal(typeof res.isA2HS, 'boolean');
      assert.ok(res.message);
    });

    it('calculates storage quota estimate and usage formatting', async () => {
      const estimate = await persistenceManager.getStorageEstimate();
      assert.ok(estimate.quota > 0);
      assert.ok(estimate.usage >= 0);
      assert.ok(typeof estimate.formattedQuota === 'string');
      assert.ok(typeof estimate.formattedUsage === 'string');
    });

    it('assesses WebKit 7-day eviction risk and returns actionable recommendations', async () => {
      const assessment = await persistenceManager.assessEvictionRisk();
      assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(assessment.riskLevel));
      assert.ok(typeof assessment.recommendation === 'string');
      assert.ok(assessment.recommendation.length > 10);
    });

    it('triggers storage pressure callbacks on high utilization threshold', async () => {
      let callbackFired = false;
      const unsubscribe = persistenceManager.registerStoragePressureWatcher((evt) => {
        callbackFired = true;
        assert.equal(evt.status, 'STORAGE_PRESSURE');
      });

      // Manually notify watcher to verify event delivery
      persistenceManager._notifyWatchers({ quota: 1000, usage: 900, percentageUsed: 90, status: 'STORAGE_PRESSURE' });
      assert.equal(callbackFired, true);

      unsubscribe();
    });

    it('executes complete init sequence returning summary object', async () => {
      const summary = await persistenceManager.init();
      assert.ok(summary);
      assert.equal(typeof summary.persisted, 'boolean');
      assert.ok(summary.estimate);
      assert.ok(summary.evictionRisk);
    });
  });

  // ==========================================================================
  // 4. Simulated Geolocation Hardware Adapter
  // ==========================================================================
  describe('4. Simulated Geolocation Hardware Adapter', () => {
    let geoAdapter;

    beforeEach(() => {
      geoAdapter = new SimulatedGeolocationAdapter();
    });

    it('returns known operational medical locations catalog', () => {
      const locations = geoAdapter.getKnownLocations();
      assert.ok(locations.CLINICA_EL_ROSARIO_TESORO);
      assert.ok(locations.CLINICA_CLOFAN);
      assert.ok(locations.CLINICA_CARDIO_VID);
      assert.ok(locations.AEROPUERTO_JMC_RIONEGRO);
      assert.equal(locations.CLINICA_EL_ROSARIO_TESORO.lat, 6.2088);
    });

    it('reads current position and supports location overrides with watcher notification', async () => {
      let notifiedLocation = null;
      const stopWatch = geoAdapter.watchPosition((coord) => {
        notifiedLocation = coord;
      });

      assert.ok(notifiedLocation);

      // Override to Cardio VID
      geoAdapter.setSimulatedLocation(KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CARDIO_VID);
      const current = await geoAdapter.getCurrentPosition();

      assert.equal(current.lat, 6.2754);
      assert.equal(current.lng, -75.5684);
      assert.equal(notifiedLocation.lat, 6.2754);

      stopWatch();
    });

    it('calculates exact Haversine distance and geofence containment', () => {
      const cloFan = KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CLOFAN;
      const elTesoro = KNOWN_OPERATIONAL_LOCATIONS.CLINICA_EL_ROSARIO_TESORO;

      const distance = geoAdapter.calculateDistance(cloFan, elTesoro);
      // Distance between Ciudad del Río (Clofán) and El Tesoro is ~1.5 - 2.5 km
      assert.ok(distance > 1000 && distance < 3000);

      // Inside 200m geofence
      const nearTesoro = { lat: 6.2087, lng: -75.5677 };
      assert.equal(geoAdapter.isWithinGeofence(nearTesoro, elTesoro, 200), true);

      // Outside geofence
      assert.equal(geoAdapter.isWithinGeofence(cloFan, elTesoro, 200), false);
    });

    it('replays multi-stop waypoint routes', async () => {
      const waypoints = [
        KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        KNOWN_OPERATIONAL_LOCATIONS.HOTEL_POBLADO_PLAZA,
        KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CLOFAN
      ];

      const stepsVisited = [];
      await geoAdapter.simulateRoute(waypoints, 0, (coord, idx) => {
        stepsVisited.push({ idx, lat: coord.lat });
      });

      assert.equal(stepsVisited.length, 3);
      assert.equal(stepsVisited[0].lat, KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO.lat);
      assert.equal(stepsVisited[2].lat, KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CLOFAN.lat);
    });
  });

  // ==========================================================================
  // 5. Canvas Digital Signature Hardware Adapter
  // ==========================================================================
  describe('5. Canvas Digital Signature Hardware Adapter', () => {
    let sigAdapter;

    beforeEach(() => {
      sigAdapter = new CanvasSignatureAdapter({ width: 400, height: 200 });
    });

    it('records stroke coordinates and manages empty status', () => {
      assert.equal(sigAdapter.isEmpty(), true);
      assert.equal(sigAdapter.getStrokeCount(), 0);

      sigAdapter.startStroke(50, 50, 0.5);
      sigAdapter.moveStroke(60, 65, 0.7);
      sigAdapter.moveStroke(80, 90, 0.8);
      sigAdapter.endStroke();

      assert.equal(sigAdapter.isEmpty(), false);
      assert.equal(sigAdapter.getStrokeCount(), 1);
    });

    it('supports multi-level undo, redo, and clear', () => {
      sigAdapter.startStroke(10, 10);
      sigAdapter.moveStroke(20, 20);
      sigAdapter.endStroke();

      sigAdapter.startStroke(30, 30);
      sigAdapter.moveStroke(40, 40);
      sigAdapter.endStroke();

      assert.equal(sigAdapter.getStrokeCount(), 2);

      sigAdapter.undo();
      assert.equal(sigAdapter.getStrokeCount(), 1);

      sigAdapter.redo();
      assert.equal(sigAdapter.getStrokeCount(), 2);

      sigAdapter.clear();
      assert.equal(sigAdapter.getStrokeCount(), 0);
      assert.equal(sigAdapter.isEmpty(), true);
    });

    it('exports clean, valid vector SVG paths with Bézier curves', () => {
      sigAdapter.startStroke(50, 100);
      sigAdapter.moveStroke(150, 50);
      sigAdapter.moveStroke(250, 120);
      sigAdapter.endStroke();

      const svg = sigAdapter.exportToSvg();
      assert.ok(svg.includes('<svg'));
      assert.ok(svg.includes('viewBox="0 0 400 200"'));
      assert.ok(svg.includes('<path d="M 50.0 100.0'));
      assert.ok(svg.includes('stroke="#0F172A"'));
    });

    it('serializes and reloads raw stroke data arrays', () => {
      sigAdapter.startStroke(15, 25);
      sigAdapter.moveStroke(35, 45);
      sigAdapter.endStroke();

      const strokes = sigAdapter.getStrokes();
      assert.equal(strokes.length, 1);

      const newSig = new CanvasSignatureAdapter();
      newSig.loadStrokes(strokes);
      assert.equal(newSig.getStrokeCount(), 1);
    });
  });

  // ==========================================================================
  // 6. Mock OCR Receipt Scanner Hardware Adapter
  // ==========================================================================
  describe('6. Mock OCR Receipt Scanner Hardware Adapter', () => {
    let ocrAdapter;

    beforeEach(() => {
      ocrAdapter = new MockOCRAdapter();
    });

    it('parses Cruz Verde pharmacy receipts with exact Money and line items', async () => {
      const result = await ocrAdapter.parseReceipt('DROGUERIAS CRUZ VERDE - TOTAL $ 85.000 COP');

      assert.equal(result.category, 'PHARMACY');
      assert.equal(result.totalAmount.amount, 85000);
      assert.equal(result.totalAmount.currency, 'COP');
      assert.equal(result.totalAmount.amountInCents, 8500000n);
      assert.ok(result.establishmentName.includes('Cruz Verde'));
      assert.ok(result.taxId);
      assert.ok(result.items.length >= 1);
    });

    it('parses airport taxi receipts with category TAXI and currency COP', async () => {
      const result = await ocrAdapter.parseReceipt('EMPRESA TAXIS AEROPUERTO RIONEGRO - TOTAL $ 130.000 COP');

      assert.equal(result.category, 'TAXI');
      assert.equal(result.totalAmount.amount, 130000);
      assert.equal(result.totalAmount.currency, 'COP');
    });

    it('parses clinical laboratory receipts with category MEDICAL_LAB', async () => {
      const result = await ocrAdapter.parseReceipt('LABORATORIO CLINICO ECHAVARRIA - VALOR TOTAL: $125.000');

      assert.equal(result.category, 'MEDICAL_LAB');
      assert.equal(result.totalAmount.amount, 125000);
    });

    it('parses USD currency receipts correctly', async () => {
      const result = await ocrAdapter.parseReceipt('CARDIO DIAGNOSTIC LAB MIAMI - TOTAL: $ 350.00 USD');

      assert.equal(result.totalAmount.currency, 'USD');
      assert.equal(result.totalAmount.amount, 350);
      assert.equal(result.totalAmount.amountInCents, 35000n);
    });

    it('supports custom registered mock templates', async () => {
      ocrAdapter.registerMockTemplate('drogueria san ignacio', {
        establishmentName: 'Droguería San Ignacio CES',
        taxId: 'NIT 901.000.111-2',
        category: 'PHARMACY',
        amountCents: 6500000n,
        currency: 'COP'
      });

      const result = await ocrAdapter.parseReceipt('Recibo de compra en Drogueria San Ignacio');
      assert.equal(result.establishmentName, 'Droguería San Ignacio CES');
      assert.equal(result.totalAmount.amount, 65000);
    });
  });

  // ==========================================================================
  // 7. Seed Archetypes Data & Hydration Subsystem
  // ==========================================================================
  describe('7. Seed Archetypes Data & Storage Hydration', () => {
    it('contains all 4 canonical Google Drive archetypes with rich data', () => {
      const archetypes = getAllArchetypes();
      assert.equal(archetypes.length, 4);

      const catia = getArchetype('RVA171');
      assert.ok(catia);
      assert.equal(catia.patientName, 'Catia Rodrigues');
      assert.equal(catia.durationDays, 5);
      assert.equal(catia.currency, 'COP');
      assert.equal(catia.itineraryItems.length, 7);

      const george = getArchetype('RVA282');
      assert.ok(george);
      assert.equal(george.patientName, 'George Miller');
      assert.equal(george.currency, 'USD');
      assert.equal(george.durationDays, 8);

      const hogenboom = getArchetype('RVA341');
      assert.ok(hogenboom);
      assert.equal(hogenboom.currency, 'COP');
      assert.equal(hogenboom.durationDays, 6);

      const rumai = getArchetype('RVA077');
      assert.ok(rumai);
      assert.equal(rumai.durationDays, 12);
      assert.equal(rumai.currency, 'COP');
    });

    it('hydrates SQLite and Blob storage with RVA171 and recalculates financial balance', async () => {
      const storage = new SqliteStorageAdapter();
      const blobStorage = new DexieBlobStorageAdapter();

      const result = await hydrateStorageWithArchetype(storage, blobStorage, 'RVA171');
      assert.ok(result.ledger instanceof SettlementLedger);
      assert.ok(result.itemsCount >= 5);

      // Verify patient record in SQLite
      const patient = await storage.getPatientRecord('ENT-PAX-0171');
      assert.ok(patient);
      assert.equal(patient.full_name, 'Catia Rodrigues');

      // Verify itineraries in SQLite
      const items = await storage.getAllItineraries({ reservationCode: 'RVA171' });
      assert.ok(items.length >= 5);

      // Verify settlement ledger
      const ledger = await storage.getSettlementLedger('RVA171');
      assert.ok(ledger);
      assert.equal(ledger.totalAdvances.amount, 2000000);
      assert.ok(ledger.totalExpenses.amount > 0);
      assert.ok(ledger.netBalance.amount > 0);

      // Verify blob storage has signature
      assert.equal(await blobStorage.hasBlob('blob-sig-rva171'), true);
    });
  });

  // ==========================================================================
  // 8. PWA Manifest & Service Worker Cache Assets
  // ==========================================================================
  describe('8. PWA Manifest & Service Worker Cache Contract', () => {
    it('manifest.json exists and conforms to PWA A2HS standalone specification', () => {
      const manifestPath = resolve(rootDir, 'manifest.json');
      assert.ok(existsSync(manifestPath), 'manifest.json debe existir');

      const manifestContent = JSON.parse(readFileSync(manifestPath, 'utf8'));
      assert.equal(manifestContent.display, 'standalone');
      assert.equal(manifestContent.short_name, 'MedicalTrip Field');
      assert.equal(manifestContent.theme_color, '#006699');
      assert.ok(manifestContent.icons.length >= 2);
    });

    it('service-worker.js exists and implements cache-first offline strategy', () => {
      const swPath = resolve(rootDir, 'service-worker.js');
      assert.ok(existsSync(swPath), 'service-worker.js debe existir');

      const swContent = readFileSync(swPath, 'utf8');
      assert.match(swContent, /medicaltrip-shell/);
      assert.match(swContent, /caches\.open/);
      assert.match(swContent, /caches\.match/);
      assert.match(swContent, /skipWaiting/);
      assert.match(swContent, /clients\.claim/);
    });
  });
});
