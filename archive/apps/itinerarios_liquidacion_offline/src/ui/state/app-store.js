/**
 * Medical Trip Colombia S.A.S. — Reactive UI State Store & Automation Bridge
 * Integrates SQLite (Tier 1), Dexie Blob Storage (Tier 2), Actor Mesh (M4), and CQRS Handlers.
 * Exposes window.MedicalTripFieldApp for programmatic automation and testing.
 */

import { DomainError } from '../../domain/errors/domain-error.js';
import { Money } from '../../domain/value-objects/money.js';
import {
  SqliteStorageAdapter,
  DexieBlobStorageAdapter,
  StoragePersistenceManager,
  SimulatedGeolocationAdapter,
  CanvasSignatureAdapter,
  MockOCRAdapter,
  ARCHETYPES_DATA,
  getArchetype,
  getAllArchetypes,
  hydrateStorageWithArchetype,
  KNOWN_OPERATIONAL_LOCATIONS
} from '../../infrastructure/index.js';
import {
  SettlementCalculator,
  LedgerHashChain,
  TransitionItineraryStatusCommand,
  RecordExpenseCommand,
  CaptureSignatureCommand,
  GetItineraryQuery,
  GetSettlementBalanceQuery,
  GetAuditReportQuery
} from '../../application/index.js';
import { ActorMeshController } from '../../actors/index.js';

export class AppStore {
  /**
   * @param {object} [options]
   * @param {SqliteStorageAdapter} [options.storagePort]
   * @param {DexieBlobStorageAdapter} [options.blobStoragePort]
   * @param {StoragePersistenceManager} [options.persistenceManager]
   * @param {SimulatedGeolocationAdapter} [options.geoAdapter]
   * @param {CanvasSignatureAdapter} [options.sigAdapter]
   * @param {MockOCRAdapter} [options.ocrAdapter]
   * @param {ActorMeshController} [options.actorMesh]
   * @param {string} [options.initialArchetype='RVA171']
   */
  constructor(options = {}) {
    this.storagePort = options.storagePort || new SqliteStorageAdapter();
    this.blobStoragePort = options.blobStoragePort || new DexieBlobStorageAdapter();
    this.persistenceManager = options.persistenceManager || new StoragePersistenceManager();
    this.geoAdapter = options.geoAdapter || new SimulatedGeolocationAdapter();
    this.sigAdapter = options.sigAdapter || new CanvasSignatureAdapter();
    this.ocrAdapter = options.ocrAdapter || new MockOCRAdapter();

    const initialCode = options.initialArchetype || 'RVA171';
    this.ledgerHashChain = new LedgerHashChain({
      storagePort: this.storagePort,
      aggregateId: initialCode
    });

    this.actorMesh = options.actorMesh || new ActorMeshController({ isSimulated: true });

    // Command and Query Handlers
    this.transitionCommand = new TransitionItineraryStatusCommand({
      storagePort: this.storagePort,
      blobStoragePort: this.blobStoragePort,
      ledgerHashChain: this.ledgerHashChain,
      actorEventBusPort: this.actorMesh
    });

    this.recordExpenseCommand = new RecordExpenseCommand({
      storagePort: this.storagePort,
      blobStoragePort: this.blobStoragePort,
      ledgerHashChain: this.ledgerHashChain
    });

    this.captureSignatureCommand = new CaptureSignatureCommand({
      storagePort: this.storagePort,
      blobStoragePort: this.blobStoragePort,
      ledgerHashChain: this.ledgerHashChain
    });

    this.getItineraryQuery = new GetItineraryQuery({ storagePort: this.storagePort });
    this.getSettlementBalanceQuery = new GetSettlementBalanceQuery({ storagePort: this.storagePort });
    this.getAuditReportQuery = new GetAuditReportQuery({
      storagePort: this.storagePort,
      ledgerHashChain: this.ledgerHashChain
    });

    // Reactive State
    this.state = {
      activeArchetypeCode: options.initialArchetype || 'RVA171',
      selectedDay: 'ALL',
      itineraryItems: [],
      itineraryMetrics: {
        total: 0,
        completed: 0,
        inSite: 0,
        inTransit: 0,
        scheduled: 0,
        cancelled: 0,
        progressPercentage: 0
      },
      settlementBalance: null,
      auditReport: null,
      activeModal: null, // 'GPS' | 'OCR' | 'SIGNATURE' | 'AUDIT' | 'EXPENSE' | null
      activeModalContext: null,
      isOffline: true,
      isPersistent: false,
      isSyncing: false,
      lastError: null,
      draftNotes: new Map()
    };

    /** @type {Set<Function>} */
    this._listeners = new Set();
    this._isHydrated = false;
  }

  /**
   * Initializes the application store, persists storage, and hydrates initial archetype.
   */
  async initialize() {
    if (this._isHydrated) return;

    try {
      // Check/request persistent storage
      if (this.persistenceManager) {
        if (typeof this.persistenceManager.isPersisted === 'function') {
          this.state.isPersistent = await this.persistenceManager.isPersisted();
        } else if (typeof this.persistenceManager.requestPersistence === 'function') {
          const res = await this.persistenceManager.requestPersistence();
          this.state.isPersistent = Boolean(res.persisted);
        }
      }

      // Hydrate default archetype
      await this.setActiveArchetype(this.state.activeArchetypeCode);
      this._isHydrated = true;
    } catch (err) {
      this.state.lastError = err.message;
      this._notify();
    }
  }

  /**
   * Subscribes a listener to state changes.
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    // Immediately emit current state
    listener(this.getState());
    return () => this._listeners.delete(listener);
  }

  /**
   * Returns a copy of current state.
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Notifies all registered subscribers of state mutation.
   * @private
   */
  _notify() {
    const currentState = this.getState();
    for (const listener of this._listeners) {
      try {
        listener(currentState);
      } catch (err) {
        console.error('[AppStore] Error in subscriber callback:', err);
      }
    }
  }

  /**
   * Gets active archetype code.
   * @returns {string}
   */
  getActiveArchetype() {
    return this.state.activeArchetypeCode;
  }

  /**
   * Switches active archetype, seeds data if needed, and refreshes queries.
   * @param {string} code - e.g. 'RVA171', 'RVA282', 'RVA341', 'RVA077'
   */
  async setActiveArchetype(code) {
    if (!code) return;
    const cleanCode = String(code).toUpperCase().trim().split(/[\s-]/)[0];

    this.state.activeArchetypeCode = cleanCode;
    this.state.selectedDay = 'ALL';
    this.state.isSyncing = true;
    this._notify();

    try {
      this.ledgerHashChain = new LedgerHashChain({
        storagePort: this.storagePort,
        aggregateId: cleanCode
      });

      // Check if already in storage, otherwise hydrate
      const existing = await this.storagePort.getSettlementLedger(cleanCode);
      if (!existing) {
        await hydrateStorageWithArchetype(this.storagePort, this.blobStoragePort, cleanCode);
      }

      await this.refresh();
      this.state.lastError = null;
    } catch (err) {
      this.state.lastError = err.message;
    } finally {
      this.state.isSyncing = false;
      this._notify();
    }
  }

  /**
   * Sets active day filter for timeline.
   * @param {number | 'ALL'} day
   */
  setSelectedDay(day) {
    this.state.selectedDay = day;
    this._notify();
  }

  /**
   * Refreshes all queries for current active archetype.
   */
  async refresh() {
    const code = this.state.activeArchetypeCode;

    // 1. Fetch Itinerary
    const itinResult = await this.getItineraryQuery.execute({
      reservationCode: code
    });
    this.state.itineraryItems = itinResult.items;
    this.state.itineraryMetrics = itinResult.metrics;

    // 2. Fetch Settlement Balance
    try {
      this.state.settlementBalance = await this.getSettlementBalanceQuery.execute({
        reservationCode: code
      });
    } catch (err) {
      // If ledger not present, leave as null
      this.state.settlementBalance = null;
    }

    // 3. Fetch Audit Report
    try {
      this.state.auditReport = await this.getAuditReportQuery.execute({
        reservationCode: code
      });
    } catch (err) {
      this.state.auditReport = null;
    }

    this._notify();
  }

  /**
   * Returns current list of itinerary items.
   * @param {object} [filter]
   * @returns {import('../../domain/entities/itinerary-item.js').ItineraryItem[]}
   */
  getItinerary(filter = {}) {
    let items = [...this.state.itineraryItems];
    if (filter.dayNumber !== undefined && filter.dayNumber !== 'ALL') {
      items = items.filter((i) => i.dayNumber === Number(filter.dayNumber));
    }
    if (filter.status) {
      items = items.filter((i) => i.status === filter.status);
    }
    return items;
  }

  /**
   * Executes status transition for an itinerary item.
   * @param {string} id
   * @param {'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO'} newStatus
   * @param {object} [options]
   */
  async transitionStatus(id, newStatus, options = {}) {
    try {
      const res = await this.transitionCommand.execute({
        itineraryItemId: id,
        reservationCode: this.state.activeArchetypeCode,
        newStatus,
        coords: options.coords,
        signatureBlobId: options.signatureBlobId,
        cancellationReason: options.cancellationReason,
        timestamp: options.timestamp
      });

      await this.refresh();
      return res;
    } catch (err) {
      this.state.lastError = err.message;
      this._notify();
      throw err;
    }
  }

  /**
   * Submits GPS check-in arrival for an itinerary item.
   * @param {string} id
   * @param {{ lat: number, lng: number }} coords
   */
  async submitCheckIn(id, coords) {
    return this.transitionStatus(id, 'EN_SITIO', { coords });
  }

  /**
   * Submits digital signature and marks stop as COMPLETADO.
   * @param {string} id
   * @param {string | Blob | Uint8Array} signatureData
   * @param {string} [signerName]
   */
  async submitSignature(id, signatureData, signerName = null) {
    const item = this.state.itineraryItems.find((i) => i.id === id);
    if (!item) {
      throw new DomainError(`No se encontró el ítem '${id}'.`);
    }

    const archData = getArchetype(this.state.activeArchetypeCode);
    const patientUuid = archData ? archData.patientUuid : 'ENT-PAX-UNKNOWN';
    const patientName = signerName || (archData ? archData.patientName : 'Paciente Autorizado');

    // 1. Capture and persist signature blob
    const sigRes = await this.captureSignatureCommand.execute({
      itineraryItemId: id,
      patientUuid,
      reservationCode: this.state.activeArchetypeCode,
      signerName: patientName,
      signatureData,
      format: typeof signatureData === 'string' && signatureData.includes('<svg') ? 'svg' : 'png'
    });

    // 2. Transition status to COMPLETADO with signature blob ID
    return this.transitionStatus(id, 'COMPLETADO', {
      signatureBlobId: sigRes.blobId
    });
  }

  /**
   * Submits out-of-pocket expense to current ledger.
   * @param {object} expenseData
   */
  async submitExpense(expenseData) {
    try {
      const res = await this.recordExpenseCommand.execute({
        reservationCode: this.state.activeArchetypeCode,
        itineraryItemId: expenseData.itineraryItemId || null,
        category: expenseData.category || 'OTHER',
        description: expenseData.description || 'Gasto de Terreno',
        amount: expenseData.amount || expenseData.amountInCents,
        actorId: expenseData.actorId || 'ACT-FIELD-01',
        receiptBlob: expenseData.receiptBlob || null,
        mimeType: expenseData.mimeType || 'image/jpeg'
      });

      await this.refresh();
      return res;
    } catch (err) {
      this.state.lastError = err.message;
      this._notify();
      throw err;
    }
  }

  /**
   * Returns current settlement balance.
   */
  getSettlementBalance() {
    return this.state.settlementBalance;
  }

  /**
   * Returns full audit report.
   */
  async getAuditReport() {
    if (!this.state.auditReport) {
      await this.refresh();
    }
    return this.state.auditReport;
  }

  /**
   * Simulates receipt OCR parsing.
   * @param {Blob | string | object} receiptInput
   */
  async simulateReceiptOcr(receiptInput) {
    return this.ocrAdapter.parseReceipt(receiptInput);
  }

  /**
   * Opens modal by name with context.
   * @param {'GPS' | 'OCR' | 'SIGNATURE' | 'AUDIT' | 'EXPENSE'} modalName
   * @param {object} [context]
   */
  openModal(modalName, context = null) {
    this.state.activeModal = modalName;
    this.state.activeModalContext = context;
    this._notify();
  }

  /**
   * Closes active modal.
   */
  closeModal() {
    this.state.activeModal = null;
    this.state.activeModalContext = null;
    this._notify();
  }
}

// Global Singleton Instance
export const appStore = new AppStore();

// Automation Bridge Instance
export const MedicalTripFieldApp = {
  getStore: () => appStore,
  getActiveArchetype: () => appStore.getActiveArchetype(),
  setActiveArchetype: (code) => appStore.setActiveArchetype(code),
  getItinerary: (filter) => appStore.getItinerary(filter),
  transitionStatus: (id, newStatus, options) => appStore.transitionStatus(id, newStatus, options),
  submitCheckIn: (id, coords) => appStore.submitCheckIn(id, coords),
  submitSignature: (id, blob, name) => appStore.submitSignature(id, blob, name),
  submitExpense: (expense) => appStore.submitExpense(expense),
  getSettlementBalance: () => appStore.getSettlementBalance(),
  getAuditReport: () => appStore.getAuditReport(),
  simulateReceiptOcr: (file) => appStore.simulateReceiptOcr(file),
  openModal: (name, ctx) => appStore.openModal(name, ctx),
  closeModal: () => appStore.closeModal(),
  subscribe: (fn) => appStore.subscribe(fn),
  getState: () => appStore.getState(),
  initialize: () => appStore.initialize()
};

// Bind to window in browser environments
if (typeof window !== 'undefined') {
  window.MedicalTripFieldApp = MedicalTripFieldApp;
}
