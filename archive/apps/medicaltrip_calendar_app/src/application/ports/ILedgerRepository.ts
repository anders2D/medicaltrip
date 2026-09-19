import { FinancialTransaction } from '../../domain/entities/FinancialTransaction';
import { BalanceSheet } from '../../domain/aggregates/MedicalItinerary';

export interface ILedgerRepository {
  getTransactions(reservaId: string): Promise<FinancialTransaction[]>;
  appendTransaction(tx: FinancialTransaction): Promise<void>;
  getBalanceSheet(reservaId: string): Promise<BalanceSheet | null>;
}
