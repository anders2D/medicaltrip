import { Money } from '@/core/domain';
import { ReceiptExpense } from './ReceiptExpense';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';

export type SettlementType = 'DAILY';

export class InvalidSettlementTypeError extends Error {
  constructor(invalidType?: string) {
    super(
      `Tipo de liquidación no permitido${invalidType ? `: "${invalidType}"` : ''}. La liquidación es diaria, elimina cualquier otro tipo de liquidación.`
    );
    this.name = 'InvalidSettlementTypeError';
  }
}

export interface CashAdvance {
  readonly id: string;
  readonly date: string;
  readonly amount: Money;
  readonly description: string;
}

export class SettlementLedger {
  public readonly bookingId: string;
  public readonly totalExpenses: Money;
  public readonly totalGuideFees: Money;
  public readonly totalFleetTaxis: Money;
  public readonly totalAdvances: Money;
  public readonly netBalance: Money;
  public readonly advances: CashAdvance[];
  public readonly lastUpdated: string;
  public readonly sha256Seal?: string;
  public readonly settlementType: SettlementType = 'DAILY';
  public readonly date?: string;
  public readonly dayNumber?: number;

  private constructor(params: {
    bookingId: string;
    totalExpenses: Money;
    totalGuideFees: Money;
    totalFleetTaxis: Money;
    totalAdvances: Money;
    netBalance: Money;
    advances: CashAdvance[];
    lastUpdated: string;
    sha256Seal?: string;
    settlementType?: SettlementType;
    date?: string;
    dayNumber?: number;
  }) {
    if (params.settlementType && (params.settlementType as string) !== 'DAILY') {
      throw new InvalidSettlementTypeError(params.settlementType as string);
    }
    this.bookingId = params.bookingId;
    this.totalExpenses = params.totalExpenses;
    this.totalGuideFees = params.totalGuideFees;
    this.totalFleetTaxis = params.totalFleetTaxis;
    this.totalAdvances = params.totalAdvances;
    this.netBalance = params.netBalance;
    this.advances = params.advances;
    this.lastUpdated = params.lastUpdated;
    this.sha256Seal = params.sha256Seal;
    this.settlementType = 'DAILY';
    this.date = params.date;
    this.dayNumber = params.dayNumber;
    Object.freeze(this);
  }

  public static createEmpty(bookingId: string, date?: string, dayNumber?: number): SettlementLedger {
    return new SettlementLedger({
      bookingId,
      totalExpenses: Money.zero(),
      totalGuideFees: Money.zero(),
      totalFleetTaxis: Money.zero(),
      totalAdvances: Money.zero(),
      netBalance: Money.zero(),
      advances: [],
      lastUpdated: new Date().toISOString(),
      settlementType: 'DAILY',
      date,
      dayNumber,
    });
  }

  public static calculate(params: {
    bookingId: string;
    expenses: ReceiptExpense[];
    shifts: CompanionShift[];
    transfers: DriverTransfer[];
    advances: CashAdvance[];
    sha256Seal?: string;
    settlementType?: SettlementType;
    date?: string;
    dayNumber?: number;
  }): SettlementLedger {
    if (params.settlementType && (params.settlementType as string) !== 'DAILY') {
      throw new InvalidSettlementTypeError(params.settlementType as string);
    }

    let expenses = params.expenses;
    let shifts = params.shifts;
    let transfers = params.transfers;
    let advances = params.advances;

    // Si se especifica una fecha diaria, filtrar estrictamente los ítems de ese día operativo
    if (params.date) {
      const targetDate = params.date.split('T')[0];
      expenses = expenses.filter((e) => (e.date || '').startsWith(targetDate));
      shifts = shifts.filter((s) => (s.date || '').startsWith(targetDate));
      transfers = transfers.filter((t) => {
        const trfDate = (t.scheduledTime || '').split('T')[0];
        return !trfDate || trfDate === targetDate;
      });
      advances = advances.filter((a) => (a.date || '').startsWith(targetDate));
    }

    let totalExpenses = Money.zero();
    for (const exp of expenses) {
      if (exp.status === 'APPROVED') {
        totalExpenses = totalExpenses.add(exp.amount);
      }
    }

    let totalGuideFees = Money.zero();
    for (const shift of shifts) {
      totalGuideFees = totalGuideFees.add(shift.calculateTotalFee());
    }

    let totalFleetTaxis = Money.zero();
    for (const transfer of transfers) {
      if (transfer.status !== 'CANCELLED') {
        totalFleetTaxis = totalFleetTaxis.add(transfer.calculateTotalCost());
      }
    }

    let totalAdvances = Money.zero();
    for (const adv of advances) {
      totalAdvances = totalAdvances.add(adv.amount);
    }

    // Deterministic Master Formula:
    // Saldo Neto = (Gastos + Honorarios Guía + Flota) - Anticipos
    const totalDebits = totalExpenses.add(totalGuideFees).add(totalFleetTaxis);
    const netBalance = totalDebits.subtract(totalAdvances);

    return new SettlementLedger({
      bookingId: params.bookingId,
      totalExpenses,
      totalGuideFees,
      totalFleetTaxis,
      totalAdvances,
      netBalance,
      advances,
      lastUpdated: new Date().toISOString(),
      sha256Seal: params.sha256Seal,
      settlementType: 'DAILY',
      date: params.date,
      dayNumber: params.dayNumber,
    });
  }

  public static calculateDaily(params: {
    bookingId: string;
    date: string;
    dayNumber?: number;
    expenses: ReceiptExpense[];
    shifts: CompanionShift[];
    transfers: DriverTransfer[];
    advances: CashAdvance[];
    sha256Seal?: string;
  }): SettlementLedger {
    return SettlementLedger.calculate({
      ...params,
      settlementType: 'DAILY',
    });
  }

  public isSettled(): boolean {
    return this.netBalance.isZero();
  }

  public isPatientCredit(): boolean {
    return this.netBalance.isNegative(); // Medical Trip owes refund to patient
  }

  public isPatientDebt(): boolean {
    return this.netBalance.isPositive(); // Patient owes additional funds
  }
}
