/**
 * Medical Trip Colombia S.A.S. - SettleExpenseUseCase
 * CQRS Command Use Case for recording pharmacy disbursements, diagnostic co-pays, and parking tickets with receipts.
 */

import { IStoragePort } from '@/core/ports';
import { IBlobStoragePort } from '@/core/ports';
import { ReceiptExpense, ExpenseCategory } from '../domain/ReceiptExpense';
import { SettlementLedger } from '../domain/SettlementLedger';
import { Money } from '@/core/domain';

export interface SettleExpenseCommand {
  id?: string;
  bookingId: string;
  eventId?: string;
  category: ExpenseCategory;
  description: string;
  amount?: Money;
  amountCOP?: number;
  vendorName?: string;
  vendorTaxId?: string;
  receiptBlobData?: Blob | ArrayBuffer | string;
  receiptBlob?: Blob | ArrayBuffer | string;
  mimeType?: string;
  receiptMimeType?: string;
  receiptFileName?: string;
  date?: string;
  audited?: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface SettleExpenseResult {
  readonly expense: ReceiptExpense;
  readonly updatedLedger: SettlementLedger;
  readonly settlement: SettlementLedger;
}

export class SettleExpenseUseCase {
  constructor(
    private readonly storagePort: IStoragePort,
    private readonly blobStoragePort?: IBlobStoragePort
  ) {}

  public async execute(command: SettleExpenseCommand): Promise<SettleExpenseResult> {
    const expenseId = command.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let receiptBlobUuid: string | undefined;

    const rawBlob = command.receiptBlobData || command.receiptBlob;
    // Store binary receipt if provided
    if (rawBlob && this.blobStoragePort) {
      const blobId = `blob-rec-${expenseId}`;
      const mimeType = command.mimeType || command.receiptMimeType || 'image/jpeg';
      receiptBlobUuid = await this.blobStoragePort.saveBlob(
        blobId,
        command.bookingId,
        mimeType,
        'RECEIPT',
        rawBlob
      );
    }

    const amount = command.amount || (command.amountCOP !== undefined ? Money.fromAmount(command.amountCOP, 'COP') : Money.zero());

    const expense = new ReceiptExpense({
      id: expenseId,
      bookingId: command.bookingId,
      eventId: command.eventId,
      category: command.category,
      description: command.description,
      amount,
      vendorName: command.vendorName,
      vendorTaxId: command.vendorTaxId,
      receiptBlobUuid,
      date: command.date || new Date().toISOString(),
      audited: command.audited || false,
      status: command.status || 'APPROVED',
    });

    await this.storagePort.saveExpense(expense);

    // If linked to an itinerary event, update the event with the receipt UUID
    if (command.eventId && receiptBlobUuid) {
      const event = await this.storagePort.getEventById(command.eventId);
      if (event) {
        const updatedEvent = event.attachReceipt(receiptBlobUuid);
        await this.storagePort.saveEvent(updatedEvent);
      }
    }

    // Recalculate settlement ledger in real time
    const expenses = await this.storagePort.getExpensesByBooking(command.bookingId);
    const shifts = await this.storagePort.getShiftsByBooking(command.bookingId);
    const transfers = await this.storagePort.getTransfersByBooking(command.bookingId);
    const currentSettlement = await this.storagePort.getSettlement(command.bookingId);
    const advances = currentSettlement ? currentSettlement.advances : [];

    const updatedLedger = SettlementLedger.calculate({
      bookingId: command.bookingId,
      expenses,
      shifts,
      transfers,
      advances,
    });

    await this.storagePort.saveSettlement(updatedLedger);

    // Append to CQRS event stream
    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: command.bookingId,
      type: 'EXPENSE_SETTLED',
      payload: {
        expenseId: expense.id,
        category: expense.category,
        amount: expense.amount.toJSON(),
        netBalance: updatedLedger.netBalance.toJSON(),
      },
      timestamp: Date.now(),
    });

    return {
      expense,
      updatedLedger,
      settlement: updatedLedger,
    };
  }
}
