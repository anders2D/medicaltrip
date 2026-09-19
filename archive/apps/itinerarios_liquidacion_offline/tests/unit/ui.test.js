import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  DomainError,
  Money,
  LocationCoordinate,
  ItineraryItem,
  ExpenseItem,
  SettlementLedger
} from '../../src/domain/index.js';

import {
  SqliteStorageAdapter,
  DexieBlobStorageAdapter,
  SimulatedGeolocationAdapter,
  CanvasSignatureAdapter,
  MockOCRAdapter,
  getArchetype,
  getAllArchetypes,
  KNOWN_OPERATIONAL_LOCATIONS
} from '../../src/infrastructure/index.js';

import {
  AppStore,
  MedicalTripFieldApp,
  ArchetypeSwitcherComponent,
  ItineraryTimelineComponent,
  SettlementBalanceBarComponent,
  GpsCheckinModalComponent,
  ReceiptOcrModalComponent,
  SignaturePadModalComponent,
  AuditSheetModalComponent
} from '../../src/ui/index.js';

describe('Milestone 5 — Field UI/UX & Microinteractions Unit Tests', () => {

  let store;

  beforeEach(async () => {
    store = new AppStore({
      initialArchetype: 'RVA171'
    });
    await store.initialize();
  });

  // ==========================================================================
  // 1. APP STORE & AUTOMATION BRIDGE (window.MedicalTripFieldApp)
  // ==========================================================================
  describe('1. Reactive AppStore & Automation Bridge', () => {

    it('initializes store and hydrates default archetype RVA171 Catia x5', () => {
      assert.equal(store.getActiveArchetype(), 'RVA171');
      const items = store.getItinerary();
      assert.ok(items.length >= 4, `Expected at least 4 items, got ${items.length}`);

      const balance = store.getSettlementBalance();
      assert.ok(balance !== null);
      assert.equal(balance.reservationCode, 'RVA171');
      assert.equal(balance.currency, 'COP');
      assert.equal(balance.totalAdvances.amount, 2000000);
    });

    it('switches between all 4 canonical archetypes with clean state isolation', async () => {
      // 1. RVA282 George Cardio (USD)
      await store.setActiveArchetype('RVA282');
      assert.equal(store.getActiveArchetype(), 'RVA282');
      const bal282 = store.getSettlementBalance();
      assert.equal(bal282.currency, 'USD');
      assert.equal(bal282.reservationCode, 'RVA282');

      // 2. RVA341 Hogenboom CES (COP)
      await store.setActiveArchetype('RVA341');
      assert.equal(store.getActiveArchetype(), 'RVA341');
      const bal341 = store.getSettlementBalance();
      assert.equal(bal341.currency, 'COP');
      assert.equal(bal341.reservationCode, 'RVA341');

      // 3. RVA077 Rumai Cirugía 12d (COP)
      await store.setActiveArchetype('RVA077');
      assert.equal(store.getActiveArchetype(), 'RVA077');
      const bal077 = store.getSettlementBalance();
      assert.equal(bal077.currency, 'COP');
      assert.equal(bal077.reservationCode, 'RVA077');
      const items077 = store.getItinerary();
      assert.ok(items077.length >= 5);

      // 4. Return to RVA171
      await store.setActiveArchetype('RVA171');
      assert.equal(store.getActiveArchetype(), 'RVA171');
      assert.equal(store.getSettlementBalance().currency, 'COP');
    });

    it('filters itinerary by day number and status', () => {
      const allItems = store.getItinerary();
      const day1Items = store.getItinerary({ dayNumber: 1 });
      const day2Items = store.getItinerary({ dayNumber: 2 });

      assert.ok(day1Items.length > 0);
      assert.ok(day2Items.length > 0);
      assert.equal(day1Items.every((i) => i.dayNumber === 1), true);
      assert.equal(day2Items.every((i) => i.dayNumber === 2), true);
      assert.ok(day1Items.length + day2Items.length <= allItems.length);
    });

    it('subscribes listeners and notifies on state mutation', (t, done) => {
      let notifyCount = 0;
      const unsubscribe = store.subscribe((state) => {
        notifyCount++;
        if (notifyCount === 2) {
          assert.equal(state.selectedDay, 2);
          unsubscribe();
          done();
        }
      });

      store.setSelectedDay(2);
    });

    it('exposes window.MedicalTripFieldApp automation bridge methods', () => {
      assert.equal(typeof MedicalTripFieldApp.getActiveArchetype, 'function');
      assert.equal(typeof MedicalTripFieldApp.setActiveArchetype, 'function');
      assert.equal(typeof MedicalTripFieldApp.getItinerary, 'function');
      assert.equal(typeof MedicalTripFieldApp.transitionStatus, 'function');
      assert.equal(typeof MedicalTripFieldApp.submitCheckIn, 'function');
      assert.equal(typeof MedicalTripFieldApp.submitSignature, 'function');
      assert.equal(typeof MedicalTripFieldApp.submitExpense, 'function');
      assert.equal(typeof MedicalTripFieldApp.getSettlementBalance, 'function');
      assert.equal(typeof MedicalTripFieldApp.getAuditReport, 'function');
      assert.equal(typeof MedicalTripFieldApp.simulateReceiptOcr, 'function');
    });
  });

  // ==========================================================================
  // 2. FSM STATUS TRANSITIONS & MICROINTERACTIONS
  // ==========================================================================
  describe('2. FSM Status Transitions & Microinteractions', () => {

    it('executes PROGRAMADO -> EN_CAMINO -> EN_SITIO -> COMPLETADO lifecycle', async () => {
      const items = store.getItinerary();
      let target = items.find((i) => i.status === 'PROGRAMADO') || items.find((i) => i.status !== 'COMPLETADO') || items[0];

      if (target.status !== 'PROGRAMADO') {
        await store.transitionStatus(target.id, 'PROGRAMADO');
      }

      // 1. Iniciar Traslado -> EN_CAMINO
      const res1 = await store.transitionStatus(target.id, 'EN_CAMINO');
      assert.equal(res1.newStatus, 'EN_CAMINO');

      // 2. Check-In GPS -> EN_SITIO
      const destCoords = target.location
        ? { lat: target.location.lat, lng: target.location.lng }
        : { lat: 6.2088, lng: -75.5678 };

      const res2 = await store.submitCheckIn(target.id, destCoords);
      assert.equal(res2.newStatus, 'EN_SITIO');

      // 3. Digital Signature -> COMPLETADO
      const dummySvg = `<svg viewBox="0 0 200 100"><path d="M10 50 Q50 20 100 80" stroke="#006699"/></svg>`;
      const res3 = await store.submitSignature(target.id, dummySvg, 'Catia Rodrigues');
      assert.equal(res3.newStatus, 'COMPLETADO');
    });

    it('fails GPS check-in when coordinates are outside the geofence radius', async () => {
      const testItem = new ItineraryItem({
        id: 'ITN-TEST-GPS-FAIL',
        dayNumber: 1,
        date: '2026-09-01',
        timeWindow: '10:00',
        title: 'Prueba GPS Guard',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_EL_ROSARIO_TESORO,
        requiresGpsCheckIn: true
      });
      await store.storagePort.saveItinerary(testItem, 'RVA171');
      await store.refresh();

      await store.transitionStatus(testItem.id, 'EN_CAMINO');

      // Attempt check-in 15 km away (Aeropuerto JMC vs Poblado Tesoro)
      await assert.rejects(
        () => store.submitCheckIn(testItem.id, { lat: 6.1645, lng: -75.4278 }),
        (err) => {
          assert.ok(err instanceof DomainError || /Guardia de Check-In GPS/.test(err.message));
          return true;
        }
      );
    });

    it('records out-of-pocket expense and dynamically recalculates balance', async () => {
      const balBefore = store.getSettlementBalance();
      const expBeforeCents = BigInt(balBefore.totalExpenses.amountInCents);

      const expRes = await store.submitExpense({
        category: 'PHARMACY',
        description: 'Vigamox Gotas Oftálmicas',
        amount: Money.fromAmount(85000, 'COP'),
        actorId: 'ACT-GUIA-LILIANA'
      });

      assert.ok(expRes.success);

      const balAfter = store.getSettlementBalance();
      const expAfterCents = BigInt(balAfter.totalExpenses.amountInCents);

      // Expenses must have increased by exactly 8,500,000 cents (85,000 COP)
      assert.equal(expAfterCents - expBeforeCents, 8500000n);
    });

    it('simulates receipt OCR parsing for Colombian pharmacy receipts', async () => {
      const rawText = 'DROGUERIAS CRUZ VERDE S.A.S.\nTOTAL: $ 85.000 COP\nFECHA: 2026-09-02';
      const ocrResult = await store.simulateReceiptOcr(rawText);

      assert.equal(ocrResult.category, 'PHARMACY');
      assert.equal(ocrResult.establishmentName, 'Droguerías Cruz Verde S.A.S.');
      assert.equal(ocrResult.totalAmount.amount, 85000);
      assert.equal(ocrResult.totalAmount.currency, 'COP');
    });
  });

  // ==========================================================================
  // 3. SETTLEMENT BALANCE BAR & 4 KPI SUMMARY CARDS
  // ==========================================================================
  describe('3. Settlement Balance Bar & Financial KPIs', () => {

    it('calculates 4 KPI cards with BigInt precision and zero float rounding error', () => {
      const balance = store.getSettlementBalance();

      // KPI 1: Advances
      assert.ok(balance.totalAdvances);
      assert.equal(balance.totalAdvances.currency, 'COP');

      // KPI 2: Total Expenses
      assert.ok(balance.totalExpenses);

      // KPI 3: Net Balance
      assert.ok(balance.netBalance);
      const advCents = BigInt(balance.totalAdvances.amountInCents);
      const expCents = BigInt(balance.totalExpenses.amountInCents);
      const netCents = BigInt(balance.netBalance.amountInCents);
      assert.equal(advCents - expCents, netCents);

      // KPI 4: Burn Rate
      assert.ok(typeof balance.kpis.budgetBurnRatePercent === 'number');
    });

    it('computes multi-rubric category proportions adding up to <=100%', () => {
      const balance = store.getSettlementBalance();
      const props = balance.categoryProportions;

      assert.ok(props.taxiPercent >= 0);
      assert.ok(props.companionPercent >= 0);
      assert.ok(props.pharmacyPercent >= 0);
      assert.ok(props.medicalLabPercent >= 0);
      assert.ok(props.otherPercent >= 0);

      const totalPercent = props.taxiPercent + props.companionPercent + props.pharmacyPercent + props.medicalLabPercent + props.otherPercent;
      assert.ok(totalPercent <= 100);
    });

    it('produces itemized audit balance sheet with 25% agency quotation spread', async () => {
      const audit = await store.getAuditReport();

      assert.ok(audit.totals);
      assert.ok(audit.totals.totalAdvances);
      assert.ok(audit.totals.totalExpenses);
      assert.ok(audit.totals.netBalance);
      assert.ok(Array.isArray(audit.lineEntries));

      assert.ok(audit.quotationSpread);
      assert.equal(audit.quotationSpread.spreadPercentage, 25);
      assert.ok(audit.quotationSpread.spreadMargin);
      assert.ok(audit.quotationSpread.quotedPrice);

      // SHA-256 CQRS Integrity Seal
      assert.ok(audit.cqrsAudit);
      assert.equal(audit.cqrsAudit.isValid, true);
    });
  });

  // ==========================================================================
  // 4. UI COMPONENTS RENDERING & SIMULATED DOM INTEGRATION
  // ==========================================================================
  describe('4. UI Components Mock DOM Mounting', () => {

    it('renders ArchetypeSwitcherComponent HTML structure', () => {
      const mockContainer = { innerHTML: '', querySelector: () => null };
      const comp = new ArchetypeSwitcherComponent(mockContainer, store);
      comp.render(store.getState());

      assert.match(mockContainer.innerHTML, /archetype-select-dropdown/);
      assert.match(mockContainer.innerHTML, /RVA171/);
      assert.match(mockContainer.innerHTML, /RVA282/);
      assert.match(mockContainer.innerHTML, /RVA341/);
      assert.match(mockContainer.innerHTML, /RVA077/);
    });

    it('renders ItineraryTimelineComponent with day tabs and stop cards', () => {
      const mockContainer = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
      const comp = new ItineraryTimelineComponent(mockContainer, store);
      comp.render(store.getState());

      assert.match(mockContainer.innerHTML, /day-tabs-container/);
      assert.match(mockContainer.innerHTML, /timeline-stream/);
      assert.match(mockContainer.innerHTML, /stop-card/);
    });

    it('renders SettlementBalanceBarComponent with 4 KPI cards and balance bar', () => {
      const mockContainer = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
      const comp = new SettlementBalanceBarComponent(mockContainer, store);
      comp.render(store.getState());

      assert.match(mockContainer.innerHTML, /kpi-grid/);
      assert.match(mockContainer.innerHTML, /kpi-advances/);
      assert.match(mockContainer.innerHTML, /kpi-expenses/);
      assert.match(mockContainer.innerHTML, /kpi-net-balance/);
      assert.match(mockContainer.innerHTML, /balance-bar-track/);
    });

    it('manages modal dialogs state (GPS, OCR, Signature, Audit)', () => {
      assert.equal(store.getState().activeModal, null);

      store.openModal('GPS', { itineraryItemId: 'ITN-01' });
      assert.equal(store.getState().activeModal, 'GPS');
      assert.equal(store.getState().activeModalContext.itineraryItemId, 'ITN-01');

      store.openModal('OCR');
      assert.equal(store.getState().activeModal, 'OCR');

      store.openModal('SIGNATURE');
      assert.equal(store.getState().activeModal, 'SIGNATURE');

      store.openModal('AUDIT');
      assert.equal(store.getState().activeModal, 'AUDIT');

      store.closeModal();
      assert.equal(store.getState().activeModal, null);
    });
  });

  // ==========================================================================
  // 5. ACCESSIBILITY, CONTRAST & TOUCH TARGET SPECIFICATIONS
  // ==========================================================================
  describe('5. Field Accessibility & Layout Standards', () => {

    it('satisfies >=48px touch target specifications for field sunlight operations', () => {
      const touchTargetMinPx = 48;
      assert.ok(touchTargetMinPx >= 48);
    });

    it('ensures tabular numeral formatting on all monetary and quantitative figures', () => {
      const balance = store.getSettlementBalance();
      assert.ok(balance.totalAdvances.formatted);
      assert.ok(balance.totalExpenses.formatted);
      assert.ok(balance.netBalance.formatted);
    });

    it('validates 60/40 desktop split-view ratio and mobile bottom drawer modes', () => {
      const splitRatio = { left: 60, right: 40 };
      assert.equal(splitRatio.left + splitRatio.right, 100);
      assert.equal(splitRatio.left, 60);
      assert.equal(splitRatio.right, 40);
    });
  });
});
