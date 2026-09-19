import { DomainError, CurrencyMismatchError } from '../errors/domain-error.js';
import { Money } from '../value-objects/money.js';
import { ExpenseItem } from './expense-item.js';
import { DriverTransfer } from './driver-transfer.js';
import { CompanionShift } from './companion-shift.js';

/**
 * SettlementLedger Entity.
 * Aggregate Root for financial reconciliation, fee auditing, out-of-pocket expenses, and net balances.
 * Executes zero-floating-point calculations exclusively using BigInt integer cents.
 */
export class SettlementLedger {
  /** @type {string} */
  #reservationCode;
  /** @type {string} */
  #patientUuid;
  /** @type {'COP' | 'USD'} */
  #currency;
  /** @type {Money[]} */
  #advances;
  /** @type {ExpenseItem[]} */
  #expenses;
  /** @type {DriverTransfer[]} */
  #driverTransfers;
  /** @type {CompanionShift[]} */
  #companionShifts;
  /** @type {Money} */
  #totalAdvances;
  /** @type {Money} */
  #totalExpenses;
  /** @type {Money} */
  #netBalance;

  /**
   * @param {object} params
   * @param {string} params.reservationCode - e.g. "RVA171", "RVA282"
   * @param {string} params.patientUuid - Normalized PAX identifier e.g. "ENT-PAX-0171"
   * @param {'COP' | 'USD'} [params.currency='COP']
   * @param {Money[]} [params.advances=[]]
   * @param {ExpenseItem[]} [params.expenses=[]]
   * @param {DriverTransfer[]} [params.driverTransfers=[]]
   * @param {CompanionShift[]} [params.companionShifts=[]]
   */
  constructor({
    reservationCode,
    patientUuid,
    currency = 'COP',
    advances = [],
    expenses = [],
    driverTransfers = [],
    companionShifts = []
  } = {}) {
    if (!reservationCode || typeof reservationCode !== 'string') {
      throw new DomainError('[Liquidación Inválida] reservationCode es obligatorio.');
    }
    if (!patientUuid || typeof patientUuid !== 'string') {
      throw new DomainError('[Liquidación Inválida] patientUuid es obligatorio.');
    }

    const normCurrency = String(currency).toUpperCase().trim();
    if (normCurrency !== 'COP' && normCurrency !== 'USD') {
      throw new DomainError(`[Liquidación Inválida] Moneda no soportada: '${currency}'`);
    }

    this.#reservationCode = reservationCode.trim();
    this.#patientUuid = patientUuid.trim();
    this.#currency = /** @type {'COP' | 'USD'} */ (normCurrency);
    this.#advances = [];
    this.#expenses = [];
    this.#driverTransfers = [];
    this.#companionShifts = [];

    // Initialize collections
    for (const adv of advances) {
      this.addAdvance(adv, false);
    }
    for (const exp of expenses) {
      this.addExpense(exp, false);
    }
    for (const tr of driverTransfers) {
      this.addDriverTransfer(tr, false);
    }
    for (const sh of companionShifts) {
      this.addCompanionShift(sh, false);
    }

    this.#totalAdvances = Money.zero(this.#currency);
    this.#totalExpenses = Money.zero(this.#currency);
    this.#netBalance = Money.zero(this.#currency);

    this.recalculate();
  }

  get reservationCode() {
    return this.#reservationCode;
  }

  get patientUuid() {
    return this.#patientUuid;
  }

  get currency() {
    return this.#currency;
  }

  get advances() {
    return [...this.#advances];
  }

  get expenses() {
    return [...this.#expenses];
  }

  get driverTransfers() {
    return [...this.#driverTransfers];
  }

  get companionShifts() {
    return [...this.#companionShifts];
  }

  get totalAdvances() {
    return this.#totalAdvances;
  }

  get totalExpenses() {
    return this.#totalExpenses;
  }

  get netBalance() {
    return this.#netBalance;
  }

  /**
   * Adds an advance deposit from the patient.
   * @param {Money | { amountInCents: bigint | number, currency?: 'COP' | 'USD' }} advance
   * @param {boolean} [triggerRecalculate=true]
   */
  addAdvance(advance, triggerRecalculate = true) {
    let parsedAdvance;
    if (advance instanceof Money) {
      parsedAdvance = advance;
    } else if (advance && typeof advance === 'object' && advance.amountInCents !== undefined) {
      parsedAdvance = new Money(advance.amountInCents, advance.currency || this.#currency);
    } else if (typeof advance === 'number' || typeof advance === 'string' || typeof advance === 'bigint') {
      parsedAdvance = Money.fromAmount(advance, this.#currency);
    } else {
      throw new DomainError('[Anticipo Inválido] Monto de anticipo inválido.');
    }

    if (parsedAdvance.currency !== this.#currency) {
      throw new CurrencyMismatchError(this.#currency, parsedAdvance.currency);
    }

    this.#advances.push(parsedAdvance);
    if (triggerRecalculate) {
      this.recalculate();
    }
  }

  /**
   * Adds an out-of-pocket expense item.
   * @param {ExpenseItem | object} expense
   * @param {boolean} [triggerRecalculate=true]
   */
  addExpense(expense, triggerRecalculate = true) {
    const item = expense instanceof ExpenseItem ? expense : new ExpenseItem(expense);
    if (item.amount.currency !== this.#currency) {
      throw new CurrencyMismatchError(this.#currency, item.amount.currency);
    }
    this.#expenses.push(item);
    if (triggerRecalculate) {
      this.recalculate();
    }
  }

  /**
   * Adds a driver transfer.
   * @param {DriverTransfer | object} transfer
   * @param {boolean} [triggerRecalculate=true]
   */
  addDriverTransfer(transfer, triggerRecalculate = true) {
    const item = transfer instanceof DriverTransfer ? transfer : new DriverTransfer(transfer);
    if (item.totalCost.currency !== this.#currency) {
      throw new CurrencyMismatchError(this.#currency, item.totalCost.currency);
    }
    this.#driverTransfers.push(item);
    if (triggerRecalculate) {
      this.recalculate();
    }
  }

  /**
   * Adds a companion shift.
   * @param {CompanionShift | object} shift
   * @param {boolean} [triggerRecalculate=true]
   */
  addCompanionShift(shift, triggerRecalculate = true) {
    const item = shift instanceof CompanionShift ? shift : new CompanionShift(shift);
    if (item.totalCost.currency !== this.#currency) {
      throw new CurrencyMismatchError(this.#currency, item.totalCost.currency);
    }
    this.#companionShifts.push(item);
    if (triggerRecalculate) {
      this.recalculate();
    }
  }

  /**
   * Recomputes all totals with 100% BigInt precision.
   */
  recalculate() {
    let advancesSum = Money.zero(this.#currency);
    for (const adv of this.#advances) {
      advancesSum = advancesSum.add(adv);
    }
    this.#totalAdvances = advancesSum;

    let expensesSum = Money.zero(this.#currency);

    // Sum all non-rejected expenses (approved or proposed)
    for (const exp of this.#expenses) {
      if (exp.status !== 'REJECTED') {
        expensesSum = expensesSum.add(exp.amount);
      }
    }

    // Sum driver transfers (non-cancelled)
    for (const tr of this.#driverTransfers) {
      if (tr.status !== 'CANCELLED') {
        expensesSum = expensesSum.add(tr.totalCost);
      }
    }

    // Sum companion shifts (non-cancelled)
    for (const sh of this.#companionShifts) {
      if (sh.status !== 'CANCELLED') {
        expensesSum = expensesSum.add(sh.totalCost);
      }
    }

    this.#totalExpenses = expensesSum;
    this.#netBalance = this.#totalAdvances.subtract(this.#totalExpenses);
  }

  /**
   * Detailed category breakdowns.
   */
  getBreakdown() {
    let taxiSum = Money.zero(this.#currency);
    let companionSum = Money.zero(this.#currency);
    let pharmacySum = Money.zero(this.#currency);
    let medicalLabSum = Money.zero(this.#currency);
    let otherSum = Money.zero(this.#currency);

    for (const exp of this.#expenses) {
      if (exp.status === 'REJECTED') continue;
      switch (exp.category) {
        case 'TAXI':
          taxiSum = taxiSum.add(exp.amount);
          break;
        case 'COMPANION_HOURLY':
          companionSum = companionSum.add(exp.amount);
          break;
        case 'PHARMACY':
          pharmacySum = pharmacySum.add(exp.amount);
          break;
        case 'MEDICAL_LAB':
          medicalLabSum = medicalLabSum.add(exp.amount);
          break;
        default:
          otherSum = otherSum.add(exp.amount);
          break;
      }
    }

    for (const tr of this.#driverTransfers) {
      if (tr.status !== 'CANCELLED') {
        taxiSum = taxiSum.add(tr.totalCost);
      }
    }

    for (const sh of this.#companionShifts) {
      if (sh.status !== 'CANCELLED') {
        companionSum = companionSum.add(sh.totalCost);
      }
    }

    return {
      taxisAndTransfers: taxiSum,
      companionFees: companionSum,
      pharmacyAndMeds: pharmacySum,
      medicalLabs: medicalLabSum,
      otherExpenses: otherSum
    };
  }

  /**
   * Generates comprehensive audit summary object.
   */
  getAuditSummary() {
    const breakdown = this.getBreakdown();
    return {
      reservationCode: this.#reservationCode,
      patientUuid: this.#patientUuid,
      currency: this.#currency,
      totalAdvances: this.#totalAdvances.toJSON(),
      totalExpenses: this.#totalExpenses.toJSON(),
      netBalance: this.#netBalance.toJSON(),
      balanceStatus: this.#netBalance.isNegative()
        ? 'DEBT_OWED_BY_PATIENT'
        : this.#netBalance.isPositive()
        ? 'CREDIT_REFUND_DUE'
        : 'SETTLED_ZERO_BALANCE',
      counts: {
        advancesCount: this.#advances.length,
        expensesCount: this.#expenses.length,
        transfersCount: this.#driverTransfers.length,
        shiftsCount: this.#companionShifts.length
      },
      breakdown: {
        taxisAndTransfers: breakdown.taxisAndTransfers.toJSON(),
        companionFees: breakdown.companionFees.toJSON(),
        pharmacyAndMeds: breakdown.pharmacyAndMeds.toJSON(),
        medicalLabs: breakdown.medicalLabs.toJSON(),
        otherExpenses: breakdown.otherExpenses.toJSON()
      }
    };
  }

  toJSON() {
    return {
      reservationCode: this.#reservationCode,
      patientUuid: this.#patientUuid,
      currency: this.#currency,
      advances: this.#advances.map((a) => a.toJSON()),
      expenses: this.#expenses.map((e) => e.toJSON()),
      driverTransfers: this.#driverTransfers.map((t) => t.toJSON()),
      companionShifts: this.#companionShifts.map((s) => s.toJSON()),
      totalAdvances: this.#totalAdvances.toJSON(),
      totalExpenses: this.#totalExpenses.toJSON(),
      netBalance: this.#netBalance.toJSON(),
      auditSummary: this.getAuditSummary()
    };
  }
}
