import { CurrencyCode } from '../../domain/values/Money';
import { TransactionType } from '../../domain/entities/FinancialTransaction';

export interface RecordExpenseCommand {
  reservaId: string;
  milestoneId?: string;
  category: 'PHARMACY' | 'MEDICAL_LAB' | 'PARKING' | 'MEAL_SUBSIDY' | 'OTHER';
  description: string;
  amountCents: string | number | bigint;
  currency: CurrencyCode;
  receiptBlobOrBase64?: Blob | string;
}

export interface ProcessReceiptOCRCommand {
  reservaId: string;
  milestoneId?: string;
  imageBlobOrBase64: Blob | string;
}

export interface SettlementDTO {
  reservaId: string;
  currency: CurrencyCode;
  totalOutOfPocket: {
    amountCents: string;
    formatted: string;
  };
  totalCompanionFees: {
    amountCents: string;
    formatted: string;
  };
  totalFleetTaxis: {
    amountCents: string;
    formatted: string;
  };
  totalExpenses: {
    amountCents: string;
    formatted: string;
  };
  totalCashAdvances: {
    amountCents: string;
    formatted: string;
  };
  netBalance: {
    amountCents: string;
    formatted: string;
  };
  isPatientOwing: boolean;
  isRefundDue: boolean;
  transactions: {
    id: string;
    timestamp: string;
    type: TransactionType;
    amountCents: string;
    formattedAmount: string;
    description: string;
    receiptUuid?: string;
    audited: boolean;
  }[];
}
