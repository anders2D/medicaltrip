import { Money, CurrencyCode } from '../values/Money';
import { Booking } from '../entities/Booking';
import { ItineraryMilestone, MilestoneStatus } from '../entities/ItineraryMilestone';
import { FinancialTransaction, TransactionType } from '../entities/FinancialTransaction';
import { Coordinates } from '../values/Coordinates';
import {
  MilestoneNotFoundError,
  InvariantViolationError,
} from '../errors/DomainErrors';

export interface BalanceSheet {
  reservaId: string;
  currency: CurrencyCode;
  totalOutOfPocket: Money;
  totalCompanionFees: Money;
  totalFleetTaxis: Money;
  totalExpenses: Money; // outOfPocket + companionFees + fleetTaxis
  totalCashAdvances: Money;
  netBalance: Money; // totalExpenses - totalCashAdvances
  isPatientOwing: boolean; // netBalance > 0 (Patient owes to Medical Trip / Guide)
  isRefundDue: boolean; // netBalance < 0 (Medical Trip owes refund to patient)
  transactionCount: number;
  milestoneCount: number;
}

export interface MedicalItineraryProps {
  booking: Booking;
  milestones?: ItineraryMilestone[];
  transactions?: FinancialTransaction[];
  defaultCurrency?: CurrencyCode;
}

/**
 * MedicalItinerary Aggregate Root
 * Orchestrates the patient journey, coordinates milestones, and maintains the deterministic financial ledger.
 */
export class MedicalItinerary {
  readonly booking: Booking;
  private readonly _milestones: Map<string, ItineraryMilestone> = new Map();
  private readonly _transactions: Map<string, FinancialTransaction> = new Map();
  readonly defaultCurrency: CurrencyCode;

  constructor(props: MedicalItineraryProps) {
    if (!props.booking) {
      throw new InvariantViolationError('[Itinerario Médico]: Booking es obligatorio.');
    }
    this.booking = props.booking;
    this.defaultCurrency = props.defaultCurrency || 'COP';

    if (props.milestones) {
      for (const m of props.milestones) {
        this.addMilestone(m);
      }
    }

    if (props.transactions) {
      for (const tx of props.transactions) {
        this.addTransaction(tx);
      }
    }
  }

  get id(): string {
    return this.booking.id;
  }

  get code(): string {
    return this.booking.code;
  }

  get patientId(): string {
    return this.booking.patientId;
  }

  get milestones(): readonly ItineraryMilestone[] {
    return Array.from(this._milestones.values()).sort(
      (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
    );
  }

  get transactions(): readonly FinancialTransaction[] {
    return Array.from(this._transactions.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Adds a milestone to the itinerary.
   */
  addMilestone(milestone: ItineraryMilestone): void {
    if (!milestone) {
      throw new InvariantViolationError('[Itinerario Médico]: Hito inválido.');
    }
    this._milestones.set(milestone.id, milestone);

    // If the milestone has an associated financial cost, synchronize with transactions
    if (milestone.cost.isPositive() && milestone.financialType !== 'NONE' && milestone.financialType !== 'INCLUDED') {
      const existingTxEntry = Array.from(this._transactions.entries()).find(
        ([_, t]) => t.milestoneId === milestone.id
      );
      let txType: TransactionType = 'OUT_OF_POCKET';
      if (milestone.financialType === 'GUIDE_FEE') txType = 'GUIDE_FEE';
      if (milestone.financialType === 'FLEET_TAXI') txType = 'FLEET_TAXI';

      const tx = new FinancialTransaction({
        id: existingTxEntry ? existingTxEntry[0] : `tx-auto-${milestone.id}`,
        reservaId: this.booking.code,
        milestoneId: milestone.id,
        timestamp: milestone.startDateTime,
        type: txType,
        amount: milestone.cost,
        description: `${milestone.title} (${milestone.category})`,
        receiptUuid: milestone.receiptUuid,
      });
      this.addTransaction(tx);
    }
  }

  getMilestone(milestoneId: string): ItineraryMilestone | undefined {
    return this._milestones.get(milestoneId);
  }

  getMilestoneOrThrow(milestoneId: string): ItineraryMilestone {
    const m = this._milestones.get(milestoneId);
    if (!m) {
      throw new MilestoneNotFoundError(milestoneId);
    }
    return m;
  }

  /**
   * Reschedules an existing milestone.
   */
  rescheduleMilestone(milestoneId: string, newStart: Date | string, newEnd?: Date | string): ItineraryMilestone {
    const existing = this.getMilestoneOrThrow(milestoneId);
    const updated = existing.reschedule(newStart, newEnd);
    this._milestones.set(milestoneId, updated);
    return updated;
  }

  /**
   * Updates the status of a milestone following state machine transitions.
   */
  updateMilestoneStatus(
    milestoneId: string,
    targetStatus: MilestoneStatus,
    options: { coords?: Coordinates; signatureUuid?: string; receiptUuid?: string } = {}
  ): ItineraryMilestone {
    const existing = this.getMilestoneOrThrow(milestoneId);
    let updated: ItineraryMilestone;

    switch (targetStatus) {
      case 'EN_CAMINO':
        updated = existing.startTransit();
        break;
      case 'EN_SITIO':
        updated = existing.arriveOnSite(options.coords);
        break;
      case 'COMPLETADO':
        updated = existing.complete(options);
        break;
      case 'CANCELADO':
        updated = existing.cancel();
        break;
      case 'PROGRAMADO':
        updated = new ItineraryMilestone({
          ...existing.toJSON(),
          status: 'PROGRAMADO',
          location: existing.location,
          cost: existing.cost,
        });
        break;
    }

    this._milestones.set(milestoneId, updated);
    return updated;
  }

  /**
   * Removes a milestone from the itinerary.
   */
  removeMilestone(milestoneId: string): void {
    if (!this._milestones.has(milestoneId)) {
      throw new MilestoneNotFoundError(milestoneId);
    }
    this._milestones.delete(milestoneId);
  }

  /**
   * Appends an immutable financial transaction into the ledger.
   */
  addTransaction(tx: FinancialTransaction): void {
    if (!tx) {
      throw new InvariantViolationError('[Itinerario Médico]: Transacción inválida.');
    }
    this._transactions.set(tx.id, tx);
  }

  /**
   * Helper to log an out-of-pocket pharmacy/supplies expense.
   */
  recordOutOfPocketExpense(
    description: string,
    amount: Money,
    options: { milestoneId?: string; receiptUuid?: string; timestamp?: Date | string } = {}
  ): FinancialTransaction {
    const tx = new FinancialTransaction({
      id: `tx-exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      reservaId: this.booking.code,
      milestoneId: options.milestoneId,
      timestamp: options.timestamp || new Date(),
      type: 'OUT_OF_POCKET',
      amount,
      description,
      receiptUuid: options.receiptUuid,
    });
    this.addTransaction(tx);
    return tx;
  }

  /**
   * Helper to log a cash advance received from the patient.
   */
  recordCashAdvance(
    amount: Money,
    description: string,
    timestamp: Date | string = new Date()
  ): FinancialTransaction {
    const tx = new FinancialTransaction({
      id: `tx-adv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      reservaId: this.booking.code,
      timestamp,
      type: 'CASH_ADVANCE',
      amount,
      description: description || 'Abono / Anticipo de Fondos',
    });
    this.addTransaction(tx);
    return tx;
  }

  /**
   * Master Settlement Ledger Equation:
   * Net Balance = (Out-of-Pocket Expenses + Companion Fees + Fleet Taxis) - Cash Advances
   */
  calculateBalanceSheet(): BalanceSheet {
    let totalOutOfPocket = Money.zero(this.defaultCurrency);
    let totalCompanionFees = Money.zero(this.defaultCurrency);
    let totalFleetTaxis = Money.zero(this.defaultCurrency);
    let totalCashAdvances = Money.zero(this.defaultCurrency);

    for (const tx of this._transactions.values()) {
      switch (tx.type) {
        case 'OUT_OF_POCKET':
          totalOutOfPocket = totalOutOfPocket.add(tx.amount);
          break;
        case 'GUIDE_FEE':
          totalCompanionFees = totalCompanionFees.add(tx.amount);
          break;
        case 'FLEET_TAXI':
          totalFleetTaxis = totalFleetTaxis.add(tx.amount);
          break;
        case 'CASH_ADVANCE':
          totalCashAdvances = totalCashAdvances.add(tx.amount);
          break;
      }
    }

    const totalExpenses = totalOutOfPocket.add(totalCompanionFees).add(totalFleetTaxis);
    const netBalance = totalExpenses.subtract(totalCashAdvances);

    return {
      reservaId: this.booking.code,
      currency: this.defaultCurrency,
      totalOutOfPocket,
      totalCompanionFees,
      totalFleetTaxis,
      totalExpenses,
      totalCashAdvances,
      netBalance,
      isPatientOwing: netBalance.isPositive(),
      isRefundDue: netBalance.isNegative(),
      transactionCount: this._transactions.size,
      milestoneCount: this._milestones.size,
    };
  }

  toJSON(): Record<string, unknown> {
    return {
      booking: this.booking.toJSON(),
      defaultCurrency: this.defaultCurrency,
      milestones: this.milestones.map((m) => m.toJSON()),
      transactions: this.transactions.map((t) => t.toJSON()),
      balanceSheet: this.calculateBalanceSheet(),
    };
  }
}
