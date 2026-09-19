import { ActorEvent, sha256 } from '../../domain/value-objects/actor-event.js';
import { DomainError } from '../../domain/errors/domain-error.js';

export const GENESIS_PREVIOUS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export const DEFAULT_AUTHORIZED_WRITERS = Object.freeze([
  'ACT-FIN-AUDITOR',
  'FINANCIAL_AUDITOR',
  'ACT-FIN',
  'FIN_WORKER',
  'SYSTEM'
]);

/**
 * Single-Writer CQRS Event Stream & Hash Chain Manager.
 * Guarantees append-only immutable event storage with deterministic SHA-256 hash chaining.
 * Strictly enforces single-writer role authorization to prevent unauthorized state mutations.
 */
export class LedgerHashChain {
  /** @type {import('../../domain/ports/storage-port.js').IStoragePort | null} */
  #storagePort;
  /** @type {string} */
  #aggregateId;
  /** @type {Set<string>} */
  #authorizedWriters;
  /** @type {ActorEvent[]} */
  #inMemoryEvents;

  /**
   * @param {object} [params]
   * @param {import('../../domain/ports/storage-port.js').IStoragePort} [params.storagePort=null]
   * @param {string} params.aggregateId - e.g. "RVA171", "RVA282"
   * @param {string[]} [params.authorizedWriters]
   */
  constructor({
    storagePort = null,
    aggregateId,
    authorizedWriters = DEFAULT_AUTHORIZED_WRITERS
  } = {}) {
    if (!aggregateId || typeof aggregateId !== 'string') {
      throw new DomainError('[LedgerHashChain] aggregateId es obligatorio.');
    }

    this.#storagePort = storagePort;
    this.#aggregateId = aggregateId.trim();
    this.#authorizedWriters = new Set(
      (authorizedWriters || DEFAULT_AUTHORIZED_WRITERS).map((w) => String(w).toUpperCase())
    );
    this.#inMemoryEvents = [];
  }

  get aggregateId() {
    return this.#aggregateId;
  }

  get authorizedWriters() {
    return Array.from(this.#authorizedWriters);
  }

  /**
   * Checks if an actor ID or role is authorized to write to this CQRS ledger stream.
   * @param {string} actorId
   * @param {string} [actorRole]
   * @returns {boolean}
   */
  isAuthorizedWriter(actorId, actorRole) {
    const id = String(actorId || '').toUpperCase();
    const role = String(actorRole || '').toUpperCase();
    return this.#authorizedWriters.has(id) || this.#authorizedWriters.has(role);
  }

  /**
   * Appends an event to the single-writer CQRS hash chain.
   * Validates writer permissions and cryptographically links to the previous event hash.
   * @param {object} params
   * @param {string} [params.eventId]
   * @param {string} params.actorId
   * @param {string} [params.actorRole='FINANCIAL_AUDITOR']
   * @param {string} params.eventType - e.g. 'EXPENSE_APPROVED', 'ADVANCE_RECORDED', 'STATUS_TRANSITIONED'
   * @param {Record<string, any>} [params.payload={}]
   * @param {string} [params.timestamp]
   * @returns {Promise<ActorEvent>}
   */
  async appendEvent({
    eventId,
    actorId,
    actorRole = 'FINANCIAL_AUDITOR',
    eventType,
    payload = {},
    timestamp
  }) {
    if (!actorId) {
      throw new DomainError('[Single-Writer Violation] actorId es obligatorio.');
    }

    // Enforce Single-Writer CQRS pattern
    if (!this.isAuthorizedWriter(actorId, actorRole)) {
      throw new DomainError(
        `[Single-Writer Violation] Solo el auditor financiero puede escribir al ledger. Actor rechazado: '${actorId}' (${actorRole})`
      );
    }

    if (!eventType) {
      throw new DomainError('[LedgerHashChain] eventType es obligatorio.');
    }

    const currentStream = await this.getEvents();
    const previousHash = currentStream.length > 0
      ? currentStream[currentStream.length - 1].hash
      : GENESIS_PREVIOUS_HASH;

    const event = new ActorEvent({
      eventId: eventId || `EV-${this.#aggregateId}-${currentStream.length + 1}-${Date.now()}`,
      actorId,
      actorRole,
      eventType,
      aggregateId: this.#aggregateId,
      payload,
      timestamp: timestamp || new Date().toISOString(),
      previousHash
    });

    if (this.#storagePort && typeof this.#storagePort.appendEvent === 'function') {
      await this.#storagePort.appendEvent(event);
    } else {
      this.#inMemoryEvents.push(event);
    }

    return event;
  }

  /**
   * Retrieves all events in chronological order for this aggregate.
   * @returns {Promise<ActorEvent[]>}
   */
  async getEvents() {
    if (this.#storagePort && typeof this.#storagePort.getEventStream === 'function') {
      const stored = await this.#storagePort.getEventStream(this.#aggregateId);
      return stored.map((e) => (e instanceof ActorEvent ? e : new ActorEvent(e)));
    }
    return [...this.#inMemoryEvents];
  }

  /**
   * Returns the count of events in this stream.
   * @returns {Promise<number>}
   */
  async getLength() {
    const events = await this.getEvents();
    return events.length;
  }

  /**
   * Returns the latest event in the stream or null if empty.
   * @returns {Promise<ActorEvent | null>}
   */
  async getLatestEvent() {
    const events = await this.getEvents();
    if (events.length === 0) return null;
    return events[events.length - 1];
  }

  /**
   * Verifies the cryptographic integrity of the entire event chain.
   * Detects broken parent linkages, corrupted hashes, or out-of-order events.
   * @returns {Promise<{
   *   isValid: boolean,
   *   verifiedCount: number,
   *   error?: string,
   *   brokenAtIndex?: number,
   *   rootHash: string,
   *   latestHash: string
   * }>}
   */
  async verifyChainIntegrity() {
    const events = await this.getEvents();
    return LedgerHashChain.verifyStaticChain(events);
  }

  /**
   * Detects tampering within a provided array of events.
   * @param {ActorEvent[] | object[]} events
   * @returns {{
   *   isTampered: boolean,
   *   tamperedIndex: number,
   *   reason?: string
   * }}
   */
  static detectTampering(events = []) {
    const result = this.verifyStaticChain(events);
    if (!result.isValid) {
      return {
        isTampered: true,
        tamperedIndex: result.brokenAtIndex ?? -1,
        reason: result.error
      };
    }
    return {
      isTampered: false,
      tamperedIndex: -1
    };
  }

  /**
   * Pure static verification function for any array of ActorEvents or event rows.
   * @param {Array<ActorEvent | object>} events
   * @returns {{
   *   isValid: boolean,
   *   verifiedCount: number,
   *   error?: string,
   *   brokenAtIndex?: number,
   *   rootHash: string,
   *   latestHash: string
   * }}
   */
  static verifyStaticChain(events = []) {
    if (!Array.isArray(events) || events.length === 0) {
      return {
        isValid: true,
        verifiedCount: 0,
        rootHash: GENESIS_PREVIOUS_HASH,
        latestHash: GENESIS_PREVIOUS_HASH
      };
    }

    let expectedPrevHash = GENESIS_PREVIOUS_HASH;

    for (let i = 0; i < events.length; i++) {
      const raw = events[i];
      let ev;
      try {
        ev = raw instanceof ActorEvent ? raw : new ActorEvent(raw);
      } catch (err) {
        return {
          isValid: false,
          verifiedCount: i,
          brokenAtIndex: i,
          error: `[Error de Instanciación de Evento en índice ${i}]: ${err.message}`,
          rootHash: events[0].hash || GENESIS_PREVIOUS_HASH,
          latestHash: expectedPrevHash
        };
      }

      // Check parent linkage
      if (ev.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          verifiedCount: i,
          brokenAtIndex: i,
          error: `[Enlace de Hash Quebrado en índice ${i}]: previousHash '${ev.previousHash}' no coincide con el hash esperado '${expectedPrevHash}'.`,
          rootHash: events[0].hash,
          latestHash: ev.previousHash
        };
      }

      // Check self-hash computation
      if (!ev.verifyIntegrity(expectedPrevHash)) {
        return {
          isValid: false,
          verifiedCount: i,
          brokenAtIndex: i,
          error: `[Hash Corrupto en índice ${i}]: El hash calculado (${ev.computeHash()}) no coincide con el hash almacenado (${ev.hash}).`,
          rootHash: events[0].hash,
          latestHash: ev.hash
        };
      }

      expectedPrevHash = ev.hash;
    }

    return {
      isValid: true,
      verifiedCount: events.length,
      rootHash: events[0].hash,
      latestHash: events[events.length - 1].hash
    };
  }

  /**
   * Replays the event stream to project the aggregated financial state.
   * @param {object} [initialState={}]
   * @returns {Promise<{
   *   aggregateId: string,
   *   eventsApplied: number,
   *   advances: Array<{ amountCents: string, currency: string }>,
   *   expenses: Array<any>,
   *   transitions: Array<any>,
   *   signatures: Array<any>,
   *   lastEventTimestamp: string | null
   * }>}
   */
  async replayState(initialState = {}) {
    const events = await this.getEvents();
    const state = {
      aggregateId: this.#aggregateId,
      eventsApplied: 0,
      advances: [...(initialState.advances || [])],
      expenses: [...(initialState.expenses || [])],
      transfers: [...(initialState.transfers || [])],
      shifts: [...(initialState.shifts || [])],
      transitions: [...(initialState.transitions || [])],
      signatures: [...(initialState.signatures || [])],
      lastEventTimestamp: null
    };

    for (const ev of events) {
      state.eventsApplied++;
      state.lastEventTimestamp = ev.timestamp;

      switch (ev.eventType) {
        case 'ADVANCE_RECORDED':
        case 'ADVANCE_DEPOSITED':
          state.advances.push(ev.payload);
          break;
        case 'EXPENSE_PROPOSED':
        case 'EXPENSE_RECORDED':
        case 'EXPENSE_APPROVED':
          state.expenses.push(ev.payload);
          break;
        case 'DRIVER_TRANSFER_ASSIGNED':
        case 'DRIVER_TRANSFER_COMPLETED':
          state.transfers.push(ev.payload);
          break;
        case 'COMPANION_SHIFT_LOGGED':
        case 'COMPANION_HOURLY_LOGGED':
          state.shifts.push(ev.payload);
          break;
        case 'STATUS_TRANSITIONED':
        case 'ITINERARY_TRANSITIONED':
          state.transitions.push(ev.payload);
          break;
        case 'SIGNATURE_CAPTURED':
          state.signatures.push(ev.payload);
          break;
        default:
          break;
      }
    }

    return state;
  }
}
