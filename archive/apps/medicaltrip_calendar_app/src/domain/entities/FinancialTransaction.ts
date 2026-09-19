import { Money } from '../values/Money';
import { InvariantViolationError } from '../errors/DomainErrors';

export type TransactionType =
  | 'OUT_OF_POCKET'
  | 'GUIDE_FEE'
  | 'FLEET_TAXI'
  | 'CASH_ADVANCE';

export interface FinancialTransactionProps {
  id: string;
  reservaId: string;
  milestoneId?: string;
  timestamp: Date | string;
  type: TransactionType;
  amount: Money | { amountInCents: bigint | number | string; currency: 'COP' | 'USD' };
  description: string;
  receiptUuid?: string;
  audited?: boolean;
  auditedBy?: string;
}

/**
 * FinancialTransaction Entity
 * Immutable entry in the single-writer financial settlement ledger.
 */
export class FinancialTransaction {
  readonly id: string;
  readonly reservaId: string;
  readonly milestoneId?: string;
  readonly timestamp: Date;
  readonly type: TransactionType;
  readonly amount: Money;
  readonly description: string;
  readonly receiptUuid?: string;
  readonly audited: boolean;
  readonly auditedBy?: string;

  constructor(props: FinancialTransactionProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvariantViolationError('[Transacción Financiera]: ID es obligatorio.');
    }
    if (!props.reservaId || !props.reservaId.trim()) {
      throw new InvariantViolationError('[Transacción Financiera]: reservaId es obligatorio.');
    }
    if (!props.description || !props.description.trim()) {
      throw new InvariantViolationError('[Transacción Financiera]: Descripción es obligatoria.');
    }

    const ts = new Date(props.timestamp);
    if (isNaN(ts.getTime())) {
      throw new InvariantViolationError('[Transacción Financiera]: Timestamp no es una fecha válida.');
    }

    this.id = props.id.trim();
    this.reservaId = props.reservaId.trim();
    this.milestoneId = props.milestoneId;
    this.timestamp = ts;
    this.type = props.type;

    if (props.amount instanceof Money) {
      this.amount = props.amount;
    } else if (props.amount && typeof props.amount === 'object') {
      this.amount = Money.fromCents(props.amount.amountInCents, props.amount.currency);
    } else {
      throw new InvariantViolationError('[Transacción Financiera]: Monto es obligatorio.');
    }

    this.description = props.description.trim();
    this.receiptUuid = props.receiptUuid;
    this.audited = Boolean(props.audited);
    this.auditedBy = props.auditedBy;

    Object.freeze(this);
  }

  /**
   * Returns a new transaction marked as audited.
   */
  markAudited(auditorName: string): FinancialTransaction {
    return new FinancialTransaction({
      ...this.toJSON(),
      amount: this.amount,
      audited: true,
      auditedBy: auditorName,
    });
  }

  toJSON(): FinancialTransactionProps {
    return {
      id: this.id,
      reservaId: this.reservaId,
      milestoneId: this.milestoneId,
      timestamp: this.timestamp.toISOString(),
      type: this.type,
      amount: this.amount.toJSON(),
      description: this.description,
      receiptUuid: this.receiptUuid,
      audited: this.audited,
      auditedBy: this.auditedBy,
    };
  }
}
