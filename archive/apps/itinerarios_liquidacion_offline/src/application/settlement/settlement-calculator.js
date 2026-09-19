import { Money } from '../../domain/value-objects/money.js';
import { DomainError, CurrencyMismatchError } from '../../domain/errors/domain-error.js';
import { sha256 } from '../../domain/value-objects/actor-event.js';
import { ExpenseItem } from '../../domain/entities/expense-item.js';
import { DriverTransfer } from '../../domain/entities/driver-transfer.js';
import { CompanionShift } from '../../domain/entities/companion-shift.js';

/**
 * Standard Operational Rate Constants for Medical Trip Colombia S.A.S.
 */
export const SETTLEMENT_RATE_CONSTANTS = Object.freeze({
  // Companion hourly rate: $15,500 COP/h (1,550,000 cents)
  DEFAULT_COMPANION_HOURLY_RATE_COP_CENTS: 1550000n,
  // Meal subsidies
  DEFAULT_MEAL_SUBSIDY_HALF_DAY_COP_CENTS: 2500000n, // $25,000 COP
  DEFAULT_MEAL_SUBSIDY_FULL_DAY_COP_CENTS: 3500000n, // $35,000 COP
  // Spread bounds (Institutional vs Private)
  DEFAULT_MIN_SPREAD_PERCENT: 23,
  DEFAULT_RECOMMENDED_SPREAD_PERCENT: 25,
  DEFAULT_MAX_SPREAD_PERCENT: 30
});

export const OVERDRAFT_STATUSES = Object.freeze({
  REFUND_TO_PATIENT: 'REFUND_TO_PATIENT',
  BALANCED_ZERO: 'BALANCED_ZERO',
  DEBT_OWED_BY_PATIENT: 'DEBT_OWED_BY_PATIENT'
});

/**
 * Deterministic Financial Settlement & Audit Calculator.
 * Executes exact multi-day settlement arithmetic exclusively using BigInt integer cents (Fowler Money pattern).
 * 0 floating-point rounding discrepancies.
 */
export class SettlementCalculator {
  /**
   * Evaluates overdraft state based on net balance.
   * @param {Money} netBalance
   * @returns {'REFUND_TO_PATIENT' | 'BALANCED_ZERO' | 'DEBT_OWED_BY_PATIENT'}
   */
  static determineOverdraftStatus(netBalance) {
    if (!netBalance || !(netBalance instanceof Money)) {
      throw new DomainError('[SettlementCalculator] netBalance debe ser una instancia válida de Money.');
    }
    if (netBalance.isPositive()) {
      return OVERDRAFT_STATUSES.REFUND_TO_PATIENT;
    }
    if (netBalance.isNegative()) {
      return OVERDRAFT_STATUSES.DEBT_OWED_BY_PATIENT;
    }
    return OVERDRAFT_STATUSES.BALANCED_ZERO;
  }

  /**
   * Sums an array of Money advances or advance objects.
   * @param {Array<Money | { amountInCents?: bigint | string | number, amount?: number, currency?: string } | number | string | bigint>} advances
   * @param {'COP' | 'USD'} [currency='COP']
   * @returns {Money}
   */
  static calculateTotalAdvances(advances = [], currency = 'COP') {
    let total = Money.zero(currency);
    for (const adv of advances) {
      let m;
      if (adv instanceof Money) {
        m = adv;
      } else if (adv && typeof adv === 'object' && (adv.amountInCents !== undefined || adv.cents !== undefined)) {
        m = new Money(adv.amountInCents || adv.cents, adv.currency || currency);
      } else if (adv && typeof adv === 'object' && adv.amount !== undefined) {
        m = Money.fromAmount(adv.amount, adv.currency || currency);
      } else if (typeof adv === 'number' || typeof adv === 'string' || typeof adv === 'bigint') {
        m = Money.fromAmount(adv, currency);
      } else {
        continue;
      }

      if (m.currency !== currency) {
        throw new CurrencyMismatchError(currency, m.currency);
      }
      total = total.add(m);
    }
    return total;
  }

  /**
   * Aggregates expenses by category, including out-of-pocket expenses, driver transfers, and companion shifts.
   * @param {object} params
   * @param {ExpenseItem[]} [params.expenses=[]]
   * @param {DriverTransfer[]} [params.driverTransfers=[]]
   * @param {CompanionShift[]} [params.companionShifts=[]]
   * @param {'COP' | 'USD'} [params.currency='COP']
   * @returns {{
   *   taxi: Money,
   *   companion: Money,
   *   pharmacy: Money,
   *   medicalLab: Money,
   *   other: Money,
   *   driverFlatRates: Money,
   *   driverSurcharges: Money,
   *   companionWages: Money,
   *   companionMealSubsidies: Money,
   *   totalExpenses: Money
   * }}
   */
  static calculateCategoryBreakdown({
    expenses = [],
    driverTransfers = [],
    companionShifts = [],
    currency = 'COP'
  } = {}) {
    let taxiSum = Money.zero(currency);
    let companionSum = Money.zero(currency);
    let pharmacySum = Money.zero(currency);
    let medicalLabSum = Money.zero(currency);
    let otherSum = Money.zero(currency);

    let driverFlatRates = Money.zero(currency);
    let driverSurcharges = Money.zero(currency);
    let companionWages = Money.zero(currency);
    let companionMealSubsidies = Money.zero(currency);

    // 1. Process out-of-pocket expense items (exclude REJECTED)
    for (const exp of expenses) {
      const item = exp instanceof ExpenseItem ? exp : new ExpenseItem(exp);
      if (item.status === 'REJECTED') continue;
      if (item.amount.currency !== currency) {
        throw new CurrencyMismatchError(currency, item.amount.currency);
      }

      switch (item.category) {
        case 'TAXI':
          taxiSum = taxiSum.add(item.amount);
          break;
        case 'COMPANION_HOURLY':
          companionSum = companionSum.add(item.amount);
          break;
        case 'PHARMACY':
          pharmacySum = pharmacySum.add(item.amount);
          break;
        case 'MEDICAL_LAB':
          medicalLabSum = medicalLabSum.add(item.amount);
          break;
        default:
          otherSum = otherSum.add(item.amount);
          break;
      }
    }

    // 2. Process driver transfers (exclude CANCELLED)
    for (const tr of driverTransfers) {
      const item = tr instanceof DriverTransfer ? tr : new DriverTransfer(tr);
      if (item.status === 'CANCELLED') continue;
      if (item.totalCost.currency !== currency) {
        throw new CurrencyMismatchError(currency, item.totalCost.currency);
      }

      taxiSum = taxiSum.add(item.totalCost);
      driverFlatRates = driverFlatRates.add(item.flatRate);
      driverSurcharges = driverSurcharges.add(item.surcharge);
    }

    // 3. Process companion shifts (exclude CANCELLED)
    for (const sh of companionShifts) {
      const item = sh instanceof CompanionShift ? sh : new CompanionShift(sh);
      if (item.status === 'CANCELLED') continue;
      if (item.totalCost.currency !== currency) {
        throw new CurrencyMismatchError(currency, item.totalCost.currency);
      }

      companionSum = companionSum.add(item.totalCost);
      const wage = item.hourlyRate.multiply(item.totalHours);
      companionWages = companionWages.add(wage);
      companionMealSubsidies = companionMealSubsidies.add(item.mealSubsidy);
    }

    const totalExpenses = taxiSum
      .add(companionSum)
      .add(pharmacySum)
      .add(medicalLabSum)
      .add(otherSum);

    return {
      taxi: taxiSum,
      companion: companionSum,
      pharmacy: pharmacySum,
      medicalLab: medicalLabSum,
      other: otherSum,
      driverFlatRates,
      driverSurcharges,
      companionWages,
      companionMealSubsidies,
      totalExpenses
    };
  }

  /**
   * Calculates exact companion shift cost with hourly wage and meal subsidy.
   * @param {object} params
   * @param {number} params.hours
   * @param {Money | number | string | bigint} [params.hourlyRate]
   * @param {Money | number | string | bigint} [params.mealSubsidy]
   * @param {'COP' | 'USD'} [params.currency='COP']
   * @returns {{ wage: Money, subsidy: Money, totalCost: Money }}
   */
  static calculateCompanionShiftCost({
    hours,
    hourlyRate = SETTLEMENT_RATE_CONSTANTS.DEFAULT_COMPANION_HOURLY_RATE_COP_CENTS,
    mealSubsidy = null,
    currency = 'COP'
  }) {
    const numHours = Number(hours) || 0;
    if (numHours < 0) {
      throw new DomainError('[SettlementCalculator] Las horas de acompañamiento no pueden ser negativas.');
    }

    let rateMoney;
    if (hourlyRate instanceof Money) {
      rateMoney = hourlyRate;
    } else if (typeof hourlyRate === 'bigint') {
      rateMoney = new Money(hourlyRate, currency);
    } else {
      rateMoney = Money.fromAmount(hourlyRate, currency);
    }

    let subsidyMoney;
    if (mealSubsidy instanceof Money) {
      subsidyMoney = mealSubsidy;
    } else if (typeof mealSubsidy === 'bigint') {
      subsidyMoney = new Money(mealSubsidy, currency);
    } else if (mealSubsidy !== null && mealSubsidy !== undefined) {
      subsidyMoney = Money.fromAmount(mealSubsidy, currency);
    } else {
      // Auto-assign subsidy: >= 8h -> 35k COP, > 0h -> 25k COP, 0h -> 0 COP
      if (numHours >= 8) {
        subsidyMoney = new Money(SETTLEMENT_RATE_CONSTANTS.DEFAULT_MEAL_SUBSIDY_FULL_DAY_COP_CENTS, currency);
      } else if (numHours > 0) {
        subsidyMoney = new Money(SETTLEMENT_RATE_CONSTANTS.DEFAULT_MEAL_SUBSIDY_HALF_DAY_COP_CENTS, currency);
      } else {
        subsidyMoney = Money.zero(currency);
      }
    }

    const wage = rateMoney.multiply(numHours);
    const totalCost = wage.add(subsidyMoney);

    return { wage, subsidy: subsidyMoney, totalCost };
  }

  /**
   * Computes institutional vs private quotation spread (e.g. 23% - 30% margin).
   * @param {object} params
   * @param {Money | number | string | bigint} params.baseCost - Institutional or base cost
   * @param {number} [params.spreadPercentage=25] - Spread margin percentage (e.g. 25 for 25%)
   * @param {number} [params.minSpreadPercentage=23]
   * @param {number} [params.maxSpreadPercentage=30]
   * @param {'COP' | 'USD'} [params.currency='COP']
   * @returns {{
   *   baseCost: Money,
   *   spreadPercentage: number,
   *   spreadMargin: Money,
   *   quotedPrice: Money,
   *   minSpreadQuotation: { percentage: number, margin: Money, quotedPrice: Money },
   *   maxSpreadQuotation: { percentage: number, margin: Money, quotedPrice: Money }
   * }}
   */
  static calculateQuotationSpread({
    baseCost,
    spreadPercentage = SETTLEMENT_RATE_CONSTANTS.DEFAULT_RECOMMENDED_SPREAD_PERCENT,
    minSpreadPercentage = SETTLEMENT_RATE_CONSTANTS.DEFAULT_MIN_SPREAD_PERCENT,
    maxSpreadPercentage = SETTLEMENT_RATE_CONSTANTS.DEFAULT_MAX_SPREAD_PERCENT,
    currency = 'COP'
  }) {
    let base;
    if (baseCost instanceof Money) {
      base = baseCost;
    } else if (typeof baseCost === 'bigint') {
      base = new Money(baseCost, currency);
    } else {
      base = Money.fromAmount(baseCost, currency);
    }

    const spreadPct = Number(spreadPercentage);
    const minPct = Number(minSpreadPercentage);
    const maxPct = Number(maxSpreadPercentage);

    if (isNaN(spreadPct) || spreadPct < 0) {
      throw new DomainError(`[SettlementCalculator] Porcentaje de margen spread inválido: ${spreadPercentage}`);
    }

    const calcMarginAndPrice = (pct) => {
      // spreadMargin = base * (pct / 100)
      const factorStr = (pct / 100).toString();
      const margin = base.multiply(factorStr);
      const quoted = base.add(margin);
      return { percentage: pct, margin, quotedPrice: quoted };
    };

    const target = calcMarginAndPrice(spreadPct);
    const minSpread = calcMarginAndPrice(minPct);
    const maxSpread = calcMarginAndPrice(maxPct);

    return {
      baseCost: base,
      spreadPercentage: spreadPct,
      spreadMargin: target.margin,
      quotedPrice: target.quotedPrice,
      minSpreadQuotation: minSpread,
      maxSpreadQuotation: maxSpread
    };
  }

  /**
   * Generates a multi-day audit balance sheet with itemized chronological line entries and SHA-256 verification hash.
   * @param {object} params
   * @param {string} params.reservationCode
   * @param {string} params.patientUuid
   * @param {'COP' | 'USD'} [params.currency='COP']
   * @param {Array<Money | object>} [params.advances=[]]
   * @param {ExpenseItem[]} [params.expenses=[]]
   * @param {DriverTransfer[]} [params.driverTransfers=[]]
   * @param {CompanionShift[]} [params.companionShifts=[]]
   * @param {number} [params.spreadPercentage=25]
   * @param {string} [params.generatedAt]
   * @returns {object} Full itemized balance sheet with verification hash
   */
  static generateAuditBalanceSheet({
    reservationCode,
    patientUuid,
    currency = 'COP',
    advances = [],
    expenses = [],
    driverTransfers = [],
    companionShifts = [],
    spreadPercentage = SETTLEMENT_RATE_CONSTANTS.DEFAULT_RECOMMENDED_SPREAD_PERCENT,
    generatedAt = null
  }) {
    if (!reservationCode || !patientUuid) {
      throw new DomainError('[SettlementCalculator] reservationCode y patientUuid son obligatorios.');
    }

    const totalAdvances = this.calculateTotalAdvances(advances, currency);
    const breakdown = this.calculateCategoryBreakdown({
      expenses,
      driverTransfers,
      companionShifts,
      currency
    });

    const totalExpenses = breakdown.totalExpenses;
    const netBalance = totalAdvances.subtract(totalExpenses);
    const balanceStatus = this.determineOverdraftStatus(netBalance);

    // Build chronological itemized line entries
    const lineEntries = [];
    let runningBalance = Money.zero(currency);

    // 1. Line items for advances
    advances.forEach((adv, idx) => {
      let advMoney;
      let notes = 'Anticipo recibido de paciente';
      let date = generatedAt ? generatedAt.split('T')[0] : '2026-09-01';

      if (adv instanceof Money) {
        advMoney = adv;
      } else if (adv && typeof adv === 'object') {
        advMoney = adv.amountInCents !== undefined
          ? new Money(adv.amountInCents, adv.currency || currency)
          : Money.fromAmount(adv.amount || 0, adv.currency || currency);
        if (adv.notes) notes = adv.notes;
        if (adv.date) date = adv.date;
      } else {
        advMoney = Money.fromAmount(adv, currency);
      }

      runningBalance = runningBalance.add(advMoney);

      lineEntries.push({
        entryId: `ADV-${idx + 1}`,
        type: 'ADVANCE',
        category: 'ADVANCE_DEPOSIT',
        description: notes,
        actorId: 'PATIENT',
        credit: advMoney.toJSON(),
        debit: Money.zero(currency).toJSON(),
        runningBalance: runningBalance.toJSON(),
        date,
        receiptBlobId: null,
        status: 'APPLIED'
      });
    });

    // 2. Line items for expenses
    expenses.forEach((exp, idx) => {
      const item = exp instanceof ExpenseItem ? exp : new ExpenseItem(exp);
      if (item.status === 'REJECTED') return;

      runningBalance = runningBalance.subtract(item.amount);

      lineEntries.push({
        entryId: `EXP-${idx + 1}-${item.id}`,
        type: 'EXPENSE',
        category: item.category,
        description: item.description,
        actorId: item.actorId,
        credit: Money.zero(currency).toJSON(),
        debit: item.amount.toJSON(),
        runningBalance: runningBalance.toJSON(),
        date: item.timestamp ? item.timestamp.split('T')[0] : '2026-09-01',
        receiptBlobId: item.receiptBlobId,
        status: item.status
      });
    });

    // 3. Line items for driver transfers
    driverTransfers.forEach((tr, idx) => {
      const item = tr instanceof DriverTransfer ? tr : new DriverTransfer(tr);
      if (item.status === 'CANCELLED') return;

      runningBalance = runningBalance.subtract(item.totalCost);

      lineEntries.push({
        entryId: `TR-${idx + 1}-${item.id}`,
        type: 'DRIVER_TRANSFER',
        category: 'TAXI',
        description: `Traslado: ${item.origin.name || 'Origen'} -> ${item.destination.name || 'Destino'} (Tarifa base: ${item.flatRate.format()}, Recargo: ${item.surcharge.format()})`,
        actorId: item.driverActorId,
        credit: Money.zero(currency).toJSON(),
        debit: item.totalCost.toJSON(),
        runningBalance: runningBalance.toJSON(),
        date: item.startedAt ? item.startedAt.split('T')[0] : '2026-09-01',
        receiptBlobId: null,
        status: item.status
      });
    });

    // 4. Line items for companion shifts
    companionShifts.forEach((sh, idx) => {
      const item = sh instanceof CompanionShift ? sh : new CompanionShift(sh);
      if (item.status === 'CANCELLED') return;

      runningBalance = runningBalance.subtract(item.totalCost);

      lineEntries.push({
        entryId: `SHIFT-${idx + 1}-${item.id}`,
        type: 'COMPANION_SHIFT',
        category: 'COMPANION_HOURLY',
        description: `Turno Día ${item.dayNumber}: ${item.totalHours}h @ ${item.hourlyRate.format()}/h + Auxilio Alimentación ${item.mealSubsidy.format()}`,
        actorId: item.guideActorId,
        credit: Money.zero(currency).toJSON(),
        debit: item.totalCost.toJSON(),
        runningBalance: runningBalance.toJSON(),
        date: item.startTime ? item.startTime.split('T')[0] : '2026-09-01',
        receiptBlobId: null,
        status: item.status
      });
    });

    // Quotation spread calculation
    const quotationSpread = this.calculateQuotationSpread({
      baseCost: totalExpenses,
      spreadPercentage,
      currency
    });

    const timestamp = generatedAt || new Date().toISOString();

    // Canonical digest for verification hash
    const canonicalString = [
      reservationCode,
      patientUuid,
      currency,
      totalAdvances.amountInCents.toString(),
      totalExpenses.amountInCents.toString(),
      netBalance.amountInCents.toString(),
      balanceStatus,
      lineEntries.length.toString(),
      timestamp
    ].join('|');

    const verificationHash = sha256(canonicalString);

    return {
      reservationCode,
      patientUuid,
      currency,
      generatedAt: timestamp,
      totals: {
        totalAdvances: totalAdvances.toJSON(),
        totalExpenses: totalExpenses.toJSON(),
        netBalance: netBalance.toJSON(),
        balanceStatus,
        overdraftAmount: netBalance.isNegative() ? netBalance.multiply(-1).toJSON() : Money.zero(currency).toJSON(),
        refundAmount: netBalance.isPositive() ? netBalance.toJSON() : Money.zero(currency).toJSON()
      },
      categoryBreakdown: {
        taxi: breakdown.taxi.toJSON(),
        companion: breakdown.companion.toJSON(),
        pharmacy: breakdown.pharmacy.toJSON(),
        medicalLab: breakdown.medicalLab.toJSON(),
        other: breakdown.other.toJSON(),
        driverFlatRates: breakdown.driverFlatRates.toJSON(),
        driverSurcharges: breakdown.driverSurcharges.toJSON(),
        companionWages: breakdown.companionWages.toJSON(),
        companionMealSubsidies: breakdown.companionMealSubsidies.toJSON()
      },
      quotationSpread: {
        spreadPercentage: quotationSpread.spreadPercentage,
        spreadMargin: quotationSpread.spreadMargin.toJSON(),
        quotedPrice: quotationSpread.quotedPrice.toJSON(),
        minSpreadQuotation: {
          percentage: quotationSpread.minSpreadQuotation.percentage,
          margin: quotationSpread.minSpreadQuotation.margin.toJSON(),
          quotedPrice: quotationSpread.minSpreadQuotation.quotedPrice.toJSON()
        },
        maxSpreadQuotation: {
          percentage: quotationSpread.maxSpreadQuotation.percentage,
          margin: quotationSpread.maxSpreadQuotation.margin.toJSON(),
          quotedPrice: quotationSpread.maxSpreadQuotation.quotedPrice.toJSON()
        }
      },
      counts: {
        advancesCount: advances.length,
        expensesCount: expenses.filter((e) => (e.status || e.status === undefined) !== 'REJECTED').length,
        driverTransfersCount: driverTransfers.filter((t) => t.status !== 'CANCELLED').length,
        companionShiftsCount: companionShifts.filter((s) => s.status !== 'CANCELLED').length,
        totalLineEntries: lineEntries.length
      },
      lineEntries,
      verificationHash
    };
  }
}
