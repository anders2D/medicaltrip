import { DomainError } from '../../domain/errors/domain-error.js';
import { Money } from '../../domain/value-objects/money.js';
import { ExpenseItem, EXPENSE_CATEGORIES, EXPENSE_STATUSES } from '../../domain/entities/expense-item.js';

/**
 * Command Handler: RecordExpenseCommand
 * Records out-of-pocket expenses incurred by field actors (taxi fares, companion overtime, pharmacy meds, labs).
 * Integrates optional binary receipt storage in IndexedDB (Dexie) and append-only CQRS event logging.
 */
export class RecordExpenseCommand {
  /** @type {import('../../domain/ports/storage-port.js').IStoragePort} */
  #storagePort;
  /** @type {import('../../domain/ports/blob-storage-port.js').IBlobStoragePort | null} */
  #blobStoragePort;
  /** @type {import('../settlement/ledger-hash-chain.js').LedgerHashChain | null} */
  #ledgerHashChain;

  /**
   * @param {object} params
   * @param {import('../../domain/ports/storage-port.js').IStoragePort} params.storagePort
   * @param {import('../../domain/ports/blob-storage-port.js').IBlobStoragePort} [params.blobStoragePort=null]
   * @param {import('../settlement/ledger-hash-chain.js').LedgerHashChain} [params.ledgerHashChain=null]
   */
  constructor({
    storagePort,
    blobStoragePort = null,
    ledgerHashChain = null
  } = {}) {
    if (!storagePort) {
      throw new DomainError('[RecordExpenseCommand] storagePort es obligatorio.');
    }
    this.#storagePort = storagePort;
    this.#blobStoragePort = blobStoragePort;
    this.#ledgerHashChain = ledgerHashChain;
  }

  /**
   * Executes expense registration.
   * @param {object} params
   * @param {string} [params.id]
   * @param {string} [params.reservationCode]
   * @param {string} [params.itineraryItemId=null]
   * @param {'TAXI' | 'COMPANION_HOURLY' | 'PHARMACY' | 'MEDICAL_LAB' | 'OTHER'} params.category
   * @param {string} params.description
   * @param {Money | { amountInCents: bigint | number | string, currency?: 'COP' | 'USD' } | number | string | bigint} params.amount
   * @param {string} params.actorId
   * @param {string} [params.actorRole='FIELD_ACTOR']
   * @param {Blob | Uint8Array | string} [params.receiptBlob=null]
   * @param {string} [params.receiptBlobId=null]
   * @param {string} [params.mimeType='image/jpeg']
   * @param {'PROPOSED' | 'APPROVED' | 'REJECTED'} [params.status='PROPOSED']
   * @param {string} [params.timestamp]
   * @returns {Promise<{
   *   success: boolean,
   *   expense: ExpenseItem,
   *   receiptBlobId: string | null
   * }>}
   */
  async execute({
    id,
    reservationCode = null,
    itineraryItemId = null,
    category,
    description,
    amount,
    actorId,
    actorRole = 'FIELD_ACTOR',
    receiptBlob = null,
    receiptBlobId = null,
    mimeType = 'image/jpeg',
    status = 'PROPOSED',
    timestamp = null
  }) {
    const expenseId = id || `EXP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    if (!category) {
      throw new DomainError('[RecordExpenseCommand] category es obligatorio.');
    }
    if (!description) {
      throw new DomainError('[RecordExpenseCommand] description es obligatorio.');
    }
    if (!actorId) {
      throw new DomainError('[RecordExpenseCommand] actorId es obligatorio.');
    }
    if (amount === undefined || amount === null) {
      throw new DomainError('[RecordExpenseCommand] amount es obligatorio.');
    }

    let parsedAmount;
    if (amount instanceof Money) {
      parsedAmount = amount;
    } else if (amount && typeof amount === 'object' && (amount.amountInCents !== undefined || amount.cents !== undefined)) {
      parsedAmount = new Money(amount.amountInCents || amount.cents, amount.currency || 'COP');
    } else if (typeof amount === 'number' || typeof amount === 'string' || typeof amount === 'bigint') {
      parsedAmount = Money.fromAmount(amount, 'COP');
    } else {
      throw new DomainError('[RecordExpenseCommand] Formato de monto inválido.');
    }

    // Save binary receipt blob if provided
    let finalReceiptBlobId = receiptBlobId;
    if (receiptBlob && this.#blobStoragePort) {
      const generatedBlobId = receiptBlobId || `BLOB-RCPT-${expenseId}`;
      await this.#blobStoragePort.saveBlob(generatedBlobId, mimeType, receiptBlob);
      finalReceiptBlobId = generatedBlobId;
    }

    const recordedAt = timestamp || new Date().toISOString();

    const expenseItem = new ExpenseItem({
      id: expenseId,
      itineraryItemId,
      category,
      description,
      amount: parsedAmount,
      actorId,
      receiptBlobId: finalReceiptBlobId,
      timestamp: recordedAt,
      status
    });

    // Save to relational storage
    await this.#storagePort.saveExpense(expenseItem, reservationCode);

    // Record CQRS event if ledger hash chain is present
    if (this.#ledgerHashChain) {
      try {
        await this.#ledgerHashChain.appendEvent({
          actorId,
          actorRole,
          eventType: 'EXPENSE_RECORDED',
          payload: {
            expenseId: expenseItem.id,
            reservationCode,
            itineraryItemId,
            category: expenseItem.category,
            description: expenseItem.description,
            amountCents: expenseItem.amount.amountInCents.toString(),
            currency: expenseItem.amount.currency,
            actorId: expenseItem.actorId,
            receiptBlobId: expenseItem.receiptBlobId,
            status: expenseItem.status,
            timestamp: recordedAt
          },
          timestamp: recordedAt
        });
      } catch (err) {
        // In Single-Writer mode, field actors propose expenses without breaking command flow
        if (!err.message.includes('Single-Writer Violation')) {
          throw err;
        }
      }
    }

    return {
      success: true,
      expense: expenseItem,
      receiptBlobId: finalReceiptBlobId
    };
  }
}
