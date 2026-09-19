import { Money } from '@/core/domain';

export type ExpenseCategory =
  | 'PHARMACY'
  | 'MEDICAL_LAB'
  | 'PARKING'
  | 'MEAL_SUBSIDY'
  | 'SIM_CARD'
  | 'TOLL'
  | 'OTHER';

export class ReceiptExpense {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly eventId?: string;
  public readonly category: ExpenseCategory;
  public readonly description: string;
  public readonly amount: Money;
  public readonly vendorName?: string;
  public readonly vendorTaxId?: string;
  public readonly receiptBlobUuid?: string;
  public readonly date: string;
  public readonly audited: boolean;
  public readonly status: 'PENDING' | 'APPROVED' | 'REJECTED';

  constructor(params: {
    id: string;
    bookingId: string;
    eventId?: string;
    category: ExpenseCategory;
    description: string;
    amount: Money;
    vendorName?: string;
    vendorTaxId?: string;
    receiptBlobUuid?: string;
    date: string;
    audited?: boolean;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }) {
    this.id = params.id;
    this.bookingId = params.bookingId;
    this.eventId = params.eventId;
    this.category = params.category;
    this.description = params.description.trim();
    this.amount = params.amount;
    this.vendorName = params.vendorName;
    this.vendorTaxId = params.vendorTaxId;
    this.receiptBlobUuid = params.receiptBlobUuid;
    this.date = params.date;
    this.audited = params.audited || false;
    this.status = params.status || 'APPROVED';
    Object.freeze(this);
  }

  public markAudited(): ReceiptExpense {
    return new ReceiptExpense({
      ...this,
      audited: true,
    });
  }
}
