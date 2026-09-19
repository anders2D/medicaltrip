import { DomainError } from '../errors/domain-error.js';
import { Money } from '../value-objects/money.js';

export const EXPENSE_CATEGORIES = Object.freeze([
  'TAXI',
  'COMPANION_HOURLY',
  'PHARMACY',
  'MEDICAL_LAB',
  'OTHER'
]);

export const EXPENSE_STATUSES = Object.freeze([
  'PROPOSED',
  'APPROVED',
  'REJECTED'
]);

/**
 * ExpenseItem Entity.
 * Represents an out-of-pocket operational expense incurred by a field actor.
 */
export class ExpenseItem {
  /** @type {string} */
  #id;
  /** @type {string | null} */
  #itineraryItemId;
  /** @type {'TAXI' | 'COMPANION_HOURLY' | 'PHARMACY' | 'MEDICAL_LAB' | 'OTHER'} */
  #category;
  /** @type {string} */
  #description;
  /** @type {Money} */
  #amount;
  /** @type {string} */
  #actorId;
  /** @type {string | null} */
  #receiptBlobId;
  /** @type {string} */
  #timestamp;
  /** @type {'PROPOSED' | 'APPROVED' | 'REJECTED'} */
  #status;
  /** @type {string | null} */
  #rejectionReason;
  /** @type {string | null} */
  #auditedBy;

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} [params.itineraryItemId=null]
   * @param {'TAXI' | 'COMPANION_HOURLY' | 'PHARMACY' | 'MEDICAL_LAB' | 'OTHER'} params.category
   * @param {string} params.description
   * @param {Money | { amountInCents: bigint | number | string, currency?: 'COP' | 'USD' }} params.amount
   * @param {string} params.actorId
   * @param {string} [params.receiptBlobId=null]
   * @param {string} [params.timestamp]
   * @param {'PROPOSED' | 'APPROVED' | 'REJECTED'} [params.status='PROPOSED']
   * @param {string} [params.rejectionReason=null]
   * @param {string} [params.auditedBy=null]
   */
  constructor({
    id,
    itineraryItemId = null,
    category,
    description,
    amount,
    actorId,
    receiptBlobId = null,
    timestamp,
    status = 'PROPOSED',
    rejectionReason = null,
    auditedBy = null
  } = {}) {
    if (!id || typeof id !== 'string') {
      throw new DomainError('[Gasto Inválido] id es obligatorio.');
    }
    if (!actorId || typeof actorId !== 'string') {
      throw new DomainError('[Gasto Inválido] actorId es obligatorio.');
    }
    if (!description || typeof description !== 'string') {
      throw new DomainError('[Gasto Inválido] description es obligatoria.');
    }

    const normCategory = String(category || '').toUpperCase();
    if (!EXPENSE_CATEGORIES.includes(normCategory)) {
      throw new DomainError(
        `[Gasto Inválido] Categoría '${category}' no válida. Permitidas: ${EXPENSE_CATEGORIES.join(', ')}`
      );
    }

    const normStatus = String(status || 'PROPOSED').toUpperCase();
    if (!EXPENSE_STATUSES.includes(normStatus)) {
      throw new DomainError(
        `[Gasto Inválido] Estado '${status}' no válido. Permitidos: ${EXPENSE_STATUSES.join(', ')}`
      );
    }

    let parsedAmount;
    if (amount instanceof Money) {
      parsedAmount = amount;
    } else if (amount && typeof amount === 'object' && amount.amountInCents !== undefined) {
      parsedAmount = new Money(amount.amountInCents, amount.currency || 'COP');
    } else if (typeof amount === 'number' || typeof amount === 'string' || typeof amount === 'bigint') {
      parsedAmount = Money.fromAmount(amount);
    } else {
      throw new DomainError('[Gasto Inválido] Monto inválido. Debe ser una instancia de Money o convertible.');
    }

    this.#id = id;
    this.#itineraryItemId = itineraryItemId;
    this.#category = /** @type {'TAXI' | 'COMPANION_HOURLY' | 'PHARMACY' | 'MEDICAL_LAB' | 'OTHER'} */ (normCategory);
    this.#description = description.trim();
    this.#amount = parsedAmount;
    this.#actorId = actorId;
    this.#receiptBlobId = receiptBlobId;
    this.#timestamp = timestamp || new Date().toISOString();
    this.#status = /** @type {'PROPOSED' | 'APPROVED' | 'REJECTED'} */ (normStatus);
    this.#rejectionReason = rejectionReason;
    this.#auditedBy = auditedBy;
  }

  get id() {
    return this.#id;
  }

  get itineraryItemId() {
    return this.#itineraryItemId;
  }

  get category() {
    return this.#category;
  }

  get description() {
    return this.#description;
  }

  get amount() {
    return this.#amount;
  }

  get actorId() {
    return this.#actorId;
  }

  get receiptBlobId() {
    return this.#receiptBlobId;
  }

  get timestamp() {
    return this.#timestamp;
  }

  get status() {
    return this.#status;
  }

  get rejectionReason() {
    return this.#rejectionReason;
  }

  get auditedBy() {
    return this.#auditedBy;
  }

  isApproved() {
    return this.#status === 'APPROVED';
  }

  isProposed() {
    return this.#status === 'PROPOSED';
  }

  isRejected() {
    return this.#status === 'REJECTED';
  }

  /**
   * Approves this expense.
   * @param {string} auditorActorId
   * @returns {ExpenseItem} New instance or mutated entity
   */
  approve(auditorActorId) {
    if (!auditorActorId) {
      throw new DomainError('[Auditoría de Gasto] auditorActorId es obligatorio para aprobar un gasto.');
    }
    this.#status = 'APPROVED';
    this.#auditedBy = auditorActorId;
    this.#rejectionReason = null;
    return this;
  }

  /**
   * Rejects this expense.
   * @param {string} auditorActorId
   * @param {string} reason
   * @returns {ExpenseItem}
   */
  reject(auditorActorId, reason) {
    if (!auditorActorId) {
      throw new DomainError('[Auditoría de Gasto] auditorActorId es obligatorio para rechazar un gasto.');
    }
    if (!reason || !reason.trim()) {
      throw new DomainError('[Auditoría de Gasto] Debe especificarse un motivo de rechazo.');
    }
    this.#status = 'REJECTED';
    this.#auditedBy = auditorActorId;
    this.#rejectionReason = reason.trim();
    return this;
  }

  /**
   * Attaches receipt image blob ID.
   * @param {string} blobId
   * @returns {ExpenseItem}
   */
  attachReceipt(blobId) {
    if (!blobId || typeof blobId !== 'string') {
      throw new DomainError('[Recibo Inválido] blobId es obligatorio.');
    }
    this.#receiptBlobId = blobId;
    return this;
  }

  toJSON() {
    return {
      id: this.#id,
      itineraryItemId: this.#itineraryItemId,
      category: this.#category,
      description: this.#description,
      amount: this.#amount.toJSON(),
      actorId: this.#actorId,
      receiptBlobId: this.#receiptBlobId,
      timestamp: this.#timestamp,
      status: this.#status,
      rejectionReason: this.#rejectionReason,
      auditedBy: this.#auditedBy
    };
  }
}
