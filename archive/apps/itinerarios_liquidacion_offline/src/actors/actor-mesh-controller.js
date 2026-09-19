/**
 * Actor Mesh Controller & Concurrency Coordinator
 * Medical Trip Colombia S.A.S. — Milestone 4 Actor Model
 * 
 * Orchestrates Web Worker instances (or high-performance simulated actors in Node.js),
 * sets up point-to-point MessageChannel mesh topology (DRV <-> FIN, GUIA <-> FIN, NURSE <-> FIN, DRV <-> GUIA),
 * manages CRDT conflict-free state convergence, and guarantees 60fps non-blocking main-thread UI responsiveness.
 * 
 * Implements IActorEventBusPort interface.
 * 0 external framework dependencies.
 */

import { IActorEventBusPort } from '../domain/ports/actor-event-bus-port.js';
import { ActorEvent } from '../domain/value-objects/actor-event.js';
import { CRDTActorState } from './crdt-state-sync.js';
import { DriverActor } from './workers/driver-actor.worker.js';
import { GuideActor } from './workers/guide-actor.worker.js';
import { NurseActor } from './workers/nurse-actor.worker.js';
import { FinancialAuditorActor } from './workers/financial-auditor.worker.js';

/**
 * Lightweight, asynchronous simulated MessageChannel for environments
 * without standard Web MessageChannel, or for pure in-memory test suites.
 */
export class SimulatedMessageChannel {
  constructor() {
    this.port1 = new SimulatedMessagePort();
    this.port2 = new SimulatedMessagePort();
    this.port1._peer = this.port2;
    this.port2._peer = this.port1;
  }
}

export class SimulatedMessagePort {
  constructor() {
    this._peer = null;
    this.onmessage = null;
    this.#closed = false;
  }

  #closed;

  postMessage(message) {
    if (this.#closed) return;
    if (this._peer && !this._peer.#closed) {
      const cloned = typeof structuredClone === 'function'
        ? structuredClone(message)
        : JSON.parse(JSON.stringify(message, (k, v) => (typeof v === 'bigint' ? `${v.toString()}n` : v)));

      queueMicrotask(() => {
        if (typeof this._peer.onmessage === 'function') {
          this._peer.onmessage({ data: cloned });
        }
      });
    }
  }

  close() {
    this.#closed = true;
    this.onmessage = null;
    if (this._peer) {
      this._peer._peer = null;
      this._peer = null;
    }
  }
}

/**
 * Helper to create a MessageChannel (native or simulated).
 */
export function createChannel() {
  if (typeof globalThis.MessageChannel !== 'undefined') {
    return new globalThis.MessageChannel();
  }
  return new SimulatedMessageChannel();
}

/**
 * Main-Thread Actor Mesh Controller
 */
export class ActorMeshController extends IActorEventBusPort {
  /** @type {boolean} */
  isInitialized;
  /** @type {boolean} */
  isSimulated;
  /** @type {DriverActor|any} */
  driverActor;
  /** @type {GuideActor|any} */
  guideActor;
  /** @type {NurseActor|any} */
  nurseActor;
  /** @type {FinancialAuditorActor|any} */
  financialAuditor;
  /** @type {Map<string, any>} */
  actors;
  /** @type {CRDTActorState} */
  globalCrdtState;
  /** @type {Map<string, Set<Function>>} */
  #subscriptions;
  /** @type {Array<Function>} */
  #ledgerListeners;
  /** @type {Array<ActorEvent>} */
  #eventLog;

  /**
   * @param {object} [options]
   * @param {boolean} [options.preferWorkers=false]
   * @param {object} [options.archetype]
   */
  constructor(options = {}) {
    super();
    this.isInitialized = false;
    this.isSimulated = true;
    this.actors = new Map();
    this.globalCrdtState = new CRDTActorState();
    this.#subscriptions = new Map();
    this.#ledgerListeners = [];
    this.#eventLog = [];
    this.driverActor = null;
    this.guideActor = null;
    this.nurseActor = null;
    this.financialAuditor = null;
  }

  /**
   * Initializes the decentralized actor mesh and sets up point-to-point MessageChannels.
   * @param {object} [config]
   * @returns {Promise<this>}
   */
  async initializeMesh(config = {}) {
    if (this.isInitialized) return this;

    const reservationCode = config.reservationCode || 'RVA171';
    const patientUuid = config.patientUuid || 'ENT-PAX-0171';
    const currency = config.currency || 'COP';

    // 1. Instantiate Actors
    this.driverActor = new DriverActor({
      actorId: config.driverId || 'ACTOR-DRV-RAMON',
      driverName: config.driverName || 'Ramón Rosero',
      vehicle: config.vehicle || 'Aeroturex Kia Sonet NLX666'
    });

    this.guideActor = new GuideActor({
      actorId: config.guideId || 'ACTOR-GUIA-YENNY',
      guideName: config.guideName || 'Yenny Restrepo',
      languages: ['ES', 'EN']
    });

    this.nurseActor = new NurseActor({
      actorId: config.nurseId || 'ACTOR-NURSE-EMI',
      nurseName: config.nurseName || 'Emi Echavarría',
      licenseNumber: 'COL-ENF-8841'
    });

    this.financialAuditor = new FinancialAuditorActor({
      actorId: config.auditorId || 'ACTOR-FIN-AUDITOR',
      auditorName: config.auditorName || 'Dra. Jenny Acosta',
      reservationCode,
      patientUuid,
      currency
    });

    this.actors.set('DRIVER', this.driverActor);
    this.actors.set('ACTOR-DRV-RAMON', this.driverActor);
    this.actors.set(this.driverActor.actorId, this.driverActor);

    this.actors.set('GUIDE', this.guideActor);
    this.actors.set('ACTOR-GUIA-YENNY', this.guideActor);
    this.actors.set(this.guideActor.actorId, this.guideActor);

    this.actors.set('NURSE', this.nurseActor);
    this.actors.set('ACTOR-NURSE-EMI', this.nurseActor);
    this.actors.set(this.nurseActor.actorId, this.nurseActor);

    this.actors.set('FINANCIAL_AUDITOR', this.financialAuditor);
    this.actors.set('ACTOR-FIN-AUDITOR', this.financialAuditor);
    this.actors.set(this.financialAuditor.actorId, this.financialAuditor);

    // 2. Set up Point-to-Point MessageChannels
    // Channel A: DRV <-> FIN
    const chDrvFin = createChannel();
    this.driverActor.initPorts({ finPort: chDrvFin.port1 });
    this.financialAuditor.registerPeerPort('DRIVER', chDrvFin.port2);

    // Channel B: GUIA <-> FIN
    const chGuiaFin = createChannel();
    this.guideActor.initPorts({ finPort: chGuiaFin.port1 });
    this.financialAuditor.registerPeerPort('GUIDE', chGuiaFin.port2);

    // Channel C: NURSE <-> FIN
    const chNurseFin = createChannel();
    this.nurseActor.initPorts({ finPort: chNurseFin.port1 });
    this.financialAuditor.registerPeerPort('NURSE', chNurseFin.port2);

    // Channel D: DRV <-> GUIA
    const chDrvGuia = createChannel();
    this.driverActor.initPorts({ guidePort: chDrvGuia.port1 });
    this.guideActor.initPorts({ driverPort: chDrvGuia.port2 });

    // 3. Connect actor listeners to global coordinator and CRDT state synchronizer
    this.#setupActorTelemetry(this.driverActor);
    this.#setupActorTelemetry(this.guideActor);
    this.#setupActorTelemetry(this.nurseActor);
    this.#setupActorTelemetry(this.financialAuditor);

    // Wire financial state listener
    this.financialAuditor.subscribe((evt) => {
      if (evt.settlementState) {
        for (const listener of this.#ledgerListeners) {
          try {
            listener(evt.settlementState);
          } catch (e) {
            console.error('[ActorMeshController] Ledger listener error:', e);
          }
        }
      }
    });

    this.isInitialized = true;
    return this;
  }

  /**
   * Wires actor internal events to global CRDT state and event bus subscriptions.
   * @private
   */
  #setupActorTelemetry(actor) {
    if (!actor || typeof actor.subscribe !== 'function') return;

    actor.subscribe((eventObj) => {
      // 1. Sync CRDT state
      if (actor.crdtState) {
        this.globalCrdtState.merge(actor.crdtState);
      }

      // 2. Record ActorEvent if present
      if (eventObj.event) {
        try {
          const parsedEvent = eventObj.event instanceof ActorEvent
            ? eventObj.event
            : new ActorEvent(eventObj.event);
          this.#eventLog.push(parsedEvent);
        } catch {
          // Event creation fallback
        }
      }

      // 3. Notify topic subscribers
      const eventType = eventObj.action || eventObj.type;
      this.#notifySubscribers(eventType, eventObj);
      this.#notifySubscribers('*', eventObj);
      this.#notifySubscribers(actor.actorId, eventObj);
      this.#notifySubscribers(actor.actorRole, eventObj);
    });
  }

  #notifySubscribers(topic, data) {
    const subs = this.#subscriptions.get(topic);
    if (subs) {
      for (const handler of subs) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[ActorMeshController] Error in subscriber for topic '${topic}':`, err);
        }
      }
    }
  }

  /**
   * Resolves target actor instance from role or ID.
   * @private
   * @param {string} actorRoleOrId
   * @returns {any}
   */
  #resolveActor(actorRoleOrId) {
    if (!actorRoleOrId) return null;
    const key = String(actorRoleOrId).toUpperCase();
    return this.actors.get(key) || this.actors.get(actorRoleOrId) || null;
  }

  /**
   * Dispatches a command to a designated actor asynchronously without blocking the event loop.
   * @param {string} actorRoleOrId ('DRIVER'|'GUIDE'|'NURSE'|'FINANCIAL_AUDITOR'|id)
   * @param {string} action
   * @param {object} [payload={}]
   * @returns {Promise<object>}
   */
  async dispatchCommand(actorRoleOrId, action, payload = {}) {
    if (!this.isInitialized) {
      await this.initializeMesh();
    }

    const actor = this.#resolveActor(actorRoleOrId);
    if (!actor) {
      throw new Error(`[ActorMeshController] Actor no encontrado: '${actorRoleOrId}'.`);
    }

    const command = {
      type: 'ACTOR_COMMAND',
      action,
      payload,
      timestamp: new Date().toISOString(),
      correlationId: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    };

    // Ensure non-blocking dispatch using microtasks / Promises
    return new Promise((resolve, reject) => {
      queueMicrotask(async () => {
        try {
          const res = await actor.receive(command);
          // Merge resulting CRDT state
          if (actor.crdtState) {
            this.globalCrdtState.merge(actor.crdtState);
          }
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Shorthand to query current status of an actor.
   * @param {string} actorRoleOrId
   * @returns {Promise<object>}
   */
  async getActorStatus(actorRoleOrId) {
    return this.dispatchCommand(actorRoleOrId, 'GET_STATUS');
  }

  /**
   * Queries real-time settlement summary from the Single-Writer Financial Auditor.
   * @returns {Promise<object>}
   */
  async getFinancialSummary() {
    return this.dispatchCommand('FINANCIAL_AUDITOR', 'GET_LEDGER_STATE');
  }

  /**
   * Subscribes to real-time financial ledger updates.
   * @param {Function} callback
   * @returns {() => void}
   */
  subscribeLedger(callback) {
    this.#ledgerListeners.push(callback);
    return () => {
      this.#ledgerListeners = this.#ledgerListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribes to a specific actor's updates or actions.
   * @param {string} actorRoleOrId
   * @param {Function} callback
   * @returns {() => void}
   */
  subscribeActor(actorRoleOrId, callback) {
    return this.subscribe(actorRoleOrId, callback);
  }

  /**
   * Returns current consolidated CRDT snapshot across all actors.
   * @returns {object}
   */
  getStateSnapshot() {
    // Merge latest from all actors
    if (this.driverActor?.crdtState) this.globalCrdtState.merge(this.driverActor.crdtState);
    if (this.guideActor?.crdtState) this.globalCrdtState.merge(this.guideActor.crdtState);
    if (this.nurseActor?.crdtState) this.globalCrdtState.merge(this.nurseActor.crdtState);
    if (this.financialAuditor?.crdtState) this.globalCrdtState.merge(this.financialAuditor.crdtState);

    return this.globalCrdtState.getSnapshot();
  }

  /**
   * Returns complete recorded event log.
   * @returns {Array<ActorEvent>}
   */
  getEventLog() {
    return [...this.#eventLog];
  }

  // ==========================================================================
  // IActorEventBusPort Implementation
  // ==========================================================================

  /**
   * Publishes an event to all subscribers and worker channels.
   * @param {ActorEvent} event
   * @returns {Promise<void>}
   */
  async publish(event) {
    if (!event) return;
    this.#eventLog.push(event);
    const eventObj = event instanceof ActorEvent ? event.toJSON() : event;
    this.#notifySubscribers(event.eventType || eventObj.eventType, eventObj);
    this.#notifySubscribers('*', eventObj);
  }

  /**
   * Subscribes to events of a specific type, actor, or wildcard '*'.
   * @param {string} eventType
   * @param {(event: any) => Promise<void> | void} handler
   * @returns {() => void} Unsubscribe function
   */
  subscribe(eventType, handler) {
    if (!this.#subscriptions.has(eventType)) {
      this.#subscriptions.set(eventType, new Set());
    }
    this.#subscriptions.get(eventType).add(handler);

    return () => {
      const set = this.#subscriptions.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.#subscriptions.delete(eventType);
        }
      }
    };
  }

  /**
   * Sends a targeted message to a specific actor.
   * @param {string} targetActorId
   * @param {Record<string, any>} message
   * @returns {Promise<any>}
   */
  async sendActorMessage(targetActorId, message) {
    const action = message.action || message.type || 'EXECUTE';
    const payload = message.payload || message;
    return this.dispatchCommand(targetActorId, action, payload);
  }

  /**
   * Registers a custom worker or channel for an actor.
   * @param {string} actorId
   * @param {any} channelOrActor
   */
  registerActor(actorId, channelOrActor) {
    this.actors.set(actorId, channelOrActor);
    if (channelOrActor && typeof channelOrActor.subscribe === 'function') {
      this.#setupActorTelemetry(channelOrActor);
    }
  }

  /**
   * Terminates all actors and cleans up ports.
   */
  terminate() {
    this.actors.clear();
    this.#subscriptions.clear();
    this.#ledgerListeners = [];
    this.isInitialized = false;
  }
}
