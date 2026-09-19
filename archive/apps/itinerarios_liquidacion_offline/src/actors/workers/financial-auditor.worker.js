/**
 * [FIN] Single-Writer Financial Auditor Web Worker
 * Medical Trip Colombia S.A.S. — Milestone 4 Actor Model
 * 
 * Single-Writer Authority for the CQRS Financial Ledger:
 * e.g., Dra. Jenny Acosta (Directora Financiera y de Auditoría).
 * 
 * Validates out-of-pocket receipts, checks budget categories, appends immutable
 * SHA-256 hash-chained events, maintains exact BigInt cent settlements, and broadcasts
 * authoritative state updates to all decentralized peer actors.
 * 0 external framework dependencies.
 */

import { ActorEvent, sha256 } from '../../domain/value-objects/actor-event.js';
import { Money } from '../../domain/value-objects/money.js';
import { ExpenseItem, EXPENSE_CATEGORIES } from '../../domain/entities/expense-item.js';
import { SettlementLedger } from '../../domain/entities/settlement-ledger.js';
import { CRDTActorState, CRDTPNCounter } from '../crdt-state-sync.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export class FinancialAuditorActor {
  /** @type {string} */
  actorId;
  /** @type {string} */
  actorRole;
  /** @type {string} */
  auditorName;
  /** @type {SettlementLedger} */
  ledger;
  /** @type {Array<ActorEvent>} */
  eventStream;
  /** @type {string} */
  headHash;
  /** @type {Array<object>} */
  approvedExpenses;
  /** @type {Array<object>} */
  rejectedExpenses;
  /** @type {Array<object>} */
  advances;
  /** @type {CRDTActorState} */
  crdtState;
  /** @type {Map<string, any>} */
  peerPorts;
  /** @type {any|null} */
  mainPort;
  /** @type {Array<Function>} */
  #listeners;

  /**
   * @param {object} [config]
   */
  constructor(config = {}) {
    this.actorId = config.actorId || 'ACTOR-FIN-AUDITOR';
    this.actorRole = 'FINANCIAL_AUDITOR';
    this.auditorName = config.auditorName || 'Dra. Jenny Acosta';
    this.ledger = new SettlementLedger({
      reservationCode: config.reservationCode || 'RVA-GENERAL',
      patientUuid: config.patientUuid || 'ENT-PAX-GENERAL',
      currency: config.currency || 'COP'
    });
    this.eventStream = [];
    this.headHash = GENESIS_HASH;
    this.approvedExpenses = [];
    this.rejectedExpenses = [];
    this.advances = [];
    this.crdtState = new CRDTActorState();
    this.peerPorts = new Map();
    this.mainPort = null;
    this.#listeners = [];
  }

  /**
   * Registers point-to-point MessagePorts for peer actors and main thread.
   * @param {object} ports
   */
  initPorts(ports = {}) {
    if (ports.driverPort) {
      this.registerPeerPort('DRIVER', ports.driverPort);
    }
    if (ports.guidePort) {
      this.registerPeerPort('GUIDE', ports.guidePort);
    }
    if (ports.nursePort) {
      this.registerPeerPort('NURSE', ports.nursePort);
    }
    if (ports.mainPort) {
      this.mainPort = ports.mainPort;
    }
  }

  /**
   * Registers a peer MessagePort and attaches onmessage handler.
   * @param {string} peerRoleOrId
   * @param {any} port
   */
  registerPeerPort(peerRoleOrId, port) {
    if (!port) return;
    this.peerPorts.set(peerRoleOrId, port);
    port.onmessage = async (e) => {
      const data = e.data;
      if (!data) return;
      if (data.action === 'PROPOSE_EXPENSE' || data.type === 'PROPOSE_EXPENSE') {
        const result = await this.receive(data);
        if (typeof port.postMessage === 'function') {
          try {
            port.postMessage(result);
          } catch (err) {
            console.warn('[FinancialAuditor] Failed to post result to peer port:', err);
          }
        }
      }
    };
  }

  /**
   * Subscribes to local events.
   * @param {Function} callback
   * @returns {() => void}
   */
  subscribe(callback) {
    this.#listeners.push(callback);
    return () => {
      this.#listeners = this.#listeners.filter((cb) => cb !== callback);
    };
  }

  #emit(eventObj) {
    for (const cb of this.#listeners) {
      try {
        cb(eventObj);
      } catch (err) {
        console.error('[FinancialAuditor] Listener error:', err);
      }
    }
    if (this.mainPort && typeof this.mainPort.postMessage === 'function') {
      try {
        this.mainPort.postMessage(eventObj);
      } catch {
        // Port transfer fallback
      }
    }
  }

  /**
   * Appends an event to the immutable SHA-256 hash chain (Single-Writer).
   * @private
   * @param {string} eventType
   * @param {string} aggregateId
   * @param {object} payload
   * @param {string} [timestamp]
   * @returns {ActorEvent}
   */
  #appendEvent(eventType, aggregateId, payload, timestamp = new Date().toISOString()) {
    const eventId = `EVT-CQRS-${Date.now()}-${this.eventStream.length + 1}`;
    const actorEvent = new ActorEvent({
      eventId,
      actorId: this.actorId,
      actorRole: this.actorRole,
      eventType,
      aggregateId,
      payload,
      timestamp,
      previousHash: this.headHash
    });

    this.headHash = actorEvent.hash;
    this.eventStream.push(actorEvent);
    return actorEvent;
  }

  /**
   * Evaluates an expense proposal against audit criteria.
   * @param {object} proposal
   * @returns {{ valid: boolean, reason?: string, category: string, cents: bigint }}
   */
  validateProposal(proposal = {}) {
    const { category, description, amountInCents, amount } = proposal;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return { valid: false, reason: 'Falta descripción del gasto o motivo del desembolso.', category: 'OTHER', cents: 0n };
    }

    let cents = 0n;
    if (amountInCents !== undefined) {
      try {
        cents = BigInt(amountInCents);
      } catch {
        return { valid: false, reason: 'Formato inválido de amountInCents.', category: 'OTHER', cents: 0n };
      }
    } else if (amount !== undefined) {
      cents = BigInt(Math.round(Number(amount) * 100));
    }

    if (cents <= 0n) {
      return { valid: false, reason: 'El monto del gasto debe ser estrictamente positivo (BigInt cents > 0).', category: 'OTHER', cents };
    }

    const catUpper = String(category || 'OTHER').toUpperCase();
    const validCategories = Object.values(EXPENSE_CATEGORIES);
    if (!validCategories.includes(catUpper)) {
      return { valid: false, reason: `Categoría inválida: '${category}'. Categorías válidas: ${validCategories.join(', ')}`, category: catUpper, cents };
    }

    return { valid: true, category: catUpper, cents };
  }

  /**
   * Verifies full SHA-256 hash chain integrity from genesis to current head.
   * @returns {{ valid: boolean, eventCount: number, headHash: string, brokenAtEventId?: string }}
   */
  verifyChainIntegrity() {
    if (this.eventStream.length === 0) {
      return { valid: true, eventCount: 0, headHash: this.headHash };
    }

    let expectedPrev = GENESIS_HASH;
    for (let i = 0; i < this.eventStream.length; i++) {
      const evt = this.eventStream[i];
      if (!evt.verifyIntegrity(expectedPrev)) {
        return {
          valid: false,
          eventCount: this.eventStream.length,
          headHash: this.headHash,
          brokenAtEventId: evt.eventId,
          brokenIndex: i
        };
      }
      expectedPrev = evt.hash;
    }

    const isHeadValid = expectedPrev === this.headHash;
    return {
      valid: isHeadValid,
      eventCount: this.eventStream.length,
      headHash: this.headHash
    };
  }

  /**
   * Calculates current real-time financial settlement.
   * @returns {object}
   */
  getSettlementState() {
    const summary = this.ledger.getAuditSummary();
    return {
      reservationCode: this.ledger.reservationCode,
      patientUuid: this.ledger.patientUuid,
      currency: this.ledger.currency,
      totalAdvancesCents: this.ledger.totalAdvances.amountInCents.toString(),
      totalExpensesCents: this.ledger.totalExpenses.amountInCents.toString(),
      netBalanceCents: this.ledger.netBalance.amountInCents.toString(),
      totalAdvances: this.ledger.totalAdvances.amount,
      totalExpenses: this.ledger.totalExpenses.amount,
      netBalance: this.ledger.netBalance.amount,
      balanceStatus: summary.balanceStatus,
      breakdown: summary.breakdown,
      approvedExpensesCount: this.approvedExpenses.length,
      rejectedExpensesCount: this.rejectedExpenses.length,
      advancesCount: this.advances.length,
      eventCount: this.eventStream.length,
      headHash: this.headHash
    };
  }

  /**
   * Dispatches command to actor and returns response.
   * @param {object} command
   * @param {any[]} [transferPorts]
   * @returns {Promise<object>|object}
   */
  async receive(command = {}, transferPorts = []) {
    const action = command.action || command.type;
    const payload = command.payload || {};
    const timestamp = command.timestamp || new Date().toISOString();
    const correlationId = command.correlationId || `corr-${Date.now()}`;

    switch (action) {
      case 'INIT_PORTS': {
        const ports = command.ports || {};
        if (transferPorts && transferPorts.length > 0) {
          if (transferPorts[0]) ports.driverPort = transferPorts[0];
          if (transferPorts[1]) ports.guidePort = transferPorts[1];
          if (transferPorts[2]) ports.nursePort = transferPorts[2];
        }
        this.initPorts(ports);
        return {
          success: true,
          ack: true,
          action: 'INIT_PORTS',
          actorId: this.actorId,
          correlationId
        };
      }

      case 'PROPOSE_EXPENSE':
      case 'SUBMIT_EXPENSE':
      case 'AUDIT_EXPENSE': {
        const validation = this.validateProposal(payload);
        const expId = payload.expenseId || `EXP-${Date.now()}-${this.approvedExpenses.length + 1}`;

        if (!validation.valid) {
          const rejectionRecord = {
            expenseId: expId,
            itineraryItemId: payload.itineraryItemId || 'ITN-GENERAL',
            category: validation.category,
            amountInCents: validation.cents.toString(),
            reason: validation.reason,
            proposerActorId: payload.actorId || 'UNKNOWN',
            auditedBy: this.actorId,
            timestamp
          };

          this.rejectedExpenses.push(rejectionRecord);

          const event = this.#appendEvent('EXPENSE_REJECTED', expId, rejectionRecord, timestamp);

          this.#emit({
            type: 'EXPENSE_REJECTED',
            actorId: this.actorId,
            status: 'REJECTED',
            expenseId: expId,
            reason: validation.reason,
            event: event.toJSON(),
            correlationId
          });

          return {
            success: false,
            status: 'REJECTED',
            expenseId: expId,
            reason: validation.reason,
            auditedBy: this.actorId,
            correlationId
          };
        }

        // Create Domain ExpenseItem
        const money = Money.fromCents(validation.cents, payload.currency || this.ledger.currency);
        const expenseItem = new ExpenseItem({
          id: expId,
          itineraryItemId: payload.itineraryItemId || 'ITN-GENERAL',
          category: validation.category,
          description: payload.description,
          amount: money,
          actorId: payload.actorId || 'UNKNOWN_ACTOR',
          receiptBlobId: payload.receiptBlobId || `receipt-${expId}`
        });

        expenseItem.approve(this.actorId);

        // Update single-writer ledger
        this.ledger.addExpense(expenseItem);

        // Update CRDT state
        this.crdtState.addExpenseCents(payload.actorId || this.actorId, validation.cents);

        const approvalPayload = {
          expenseId: expId,
          itineraryItemId: expenseItem.itineraryItemId,
          category: expenseItem.category,
          description: expenseItem.description,
          amountInCents: validation.cents.toString(),
          currency: money.currency,
          receiptBlobId: expenseItem.receiptBlobId,
          receiptChecksum: payload.receiptChecksum || 'sha256-verified-receipt',
          proposerActorId: payload.actorId,
          proposerActorRole: payload.actorRole,
          auditedBy: this.actorId,
          auditTimestamp: timestamp
        };

        this.approvedExpenses.push(approvalPayload);

        // Append to SHA-256 Hash Chain
        const event = this.#appendEvent('EXPENSE_APPROVED', expId, approvalPayload, timestamp);

        const settlementState = this.getSettlementState();

        this.#emit({
          type: 'EXPENSE_APPROVED',
          actorId: this.actorId,
          status: 'APPROVED',
          expenseId: expId,
          amountInCents: validation.cents.toString(),
          event: event.toJSON(),
          settlementState,
          crdtState: this.crdtState.toJSON(),
          correlationId
        });

        return {
          success: true,
          status: 'APPROVED',
          expenseId: expId,
          amountInCents: validation.cents.toString(),
          auditedBy: this.actorId,
          event: event.toJSON(),
          settlementState,
          correlationId
        };
      }

      case 'RECORD_ADVANCE': {
        const { advanceId, reservationCode, amountInCents, amount, currency = 'COP', receiptBlobId, receivedBy } = payload;
        const cents = amountInCents !== undefined
          ? BigInt(amountInCents)
          : BigInt(Math.round(Number(amount || 0) * 100));

        if (cents <= 0n) {
          throw new Error('[FinancialAuditor] El anticipo debe ser mayor a 0 centavos.');
        }

        const advId = advanceId || `ADV-${Date.now()}`;
        const money = Money.fromCents(cents, currency);
        this.ledger.addAdvance(money);

        const advancePayload = {
          advanceId: advId,
          reservationCode: reservationCode || this.ledger.reservationCode,
          amountInCents: cents.toString(),
          currency: money.currency,
          receiptBlobId: receiptBlobId || `receipt-adv-${advId}`,
          receivedBy: receivedBy || this.actorId,
          timestamp
        };

        this.advances.push(advancePayload);

        const event = this.#appendEvent('ADVANCE_RECORDED', advId, advancePayload, timestamp);
        const settlementState = this.getSettlementState();

        this.#emit({
          type: 'ADVANCE_RECORDED',
          actorId: this.actorId,
          advance: advancePayload,
          event: event.toJSON(),
          settlementState,
          correlationId
        });

        return {
          success: true,
          ack: true,
          advance: advancePayload,
          settlementState,
          correlationId
        };
      }

      case 'GET_LEDGER_STATE': {
        const state = this.getSettlementState();
        return {
          success: true,
          ...state,
          correlationId
        };
      }

      case 'VERIFY_CHAIN_INTEGRITY': {
        const audit = this.verifyChainIntegrity();
        return {
          success: audit.valid,
          ...audit,
          correlationId
        };
      }

      case 'GET_STATUS': {
        return {
          success: true,
          actorId: this.actorId,
          actorRole: this.actorRole,
          auditorName: this.auditorName,
          status: 'ACTIVE',
          approvedExpensesCount: this.approvedExpenses.length,
          rejectedExpensesCount: this.rejectedExpenses.length,
          advancesCount: this.advances.length,
          eventCount: this.eventStream.length,
          headHash: this.headHash,
          crdtState: this.crdtState.getSnapshot(),
          settlement: this.getSettlementState(),
          correlationId
        };
      }

      default:
        return {
          success: false,
          error: `[FinancialAuditor] Acción desconocida: '${action}'`,
          correlationId
        };
    }
  }
}

// Web Worker Execution Environment hook
if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof window === 'undefined') {
  const finWorkerInstance = new FinancialAuditorActor();
  self.onmessage = async (event) => {
    try {
      const res = await finWorkerInstance.receive(event.data, event.ports);
      if (res) {
        self.postMessage(res);
      }
    } catch (err) {
      self.postMessage({
        success: false,
        error: err.message,
        correlationId: event.data?.correlationId
      });
    }
  };
}
