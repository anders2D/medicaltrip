import { DomainError } from '../../domain/errors/domain-error.js';
import { Money } from '../../domain/value-objects/money.js';
import { SettlementCalculator, OVERDRAFT_STATUSES } from '../settlement/settlement-calculator.js';

/**
 * Query Handler: GetSettlementBalanceQuery
 * Delivers real-time financial balance, multi-rubric category breakdown, and financial KPIs.
 */
export class GetSettlementBalanceQuery {
  /** @type {import('../../domain/ports/storage-port.js').IStoragePort} */
  #storagePort;

  /**
   * @param {object} params
   * @param {import('../../domain/ports/storage-port.js').IStoragePort} params.storagePort
   */
  constructor({ storagePort } = {}) {
    if (!storagePort) {
      throw new DomainError('[GetSettlementBalanceQuery] storagePort es obligatorio.');
    }
    this.#storagePort = storagePort;
  }

  /**
   * Executes query.
   * @param {object} params
   * @param {string} params.reservationCode - e.g. "RVA171"
   * @returns {Promise<{
   *   reservationCode: string,
   *   patientUuid: string,
   *   currency: string,
   *   totalAdvances: object,
   *   totalExpenses: object,
   *   netBalance: object,
   *   balanceStatus: string,
   *   overdraftAmount: object,
   *   refundAmount: object,
   *   breakdown: object,
   *   categoryProportions: {
   *     taxiPercent: number,
   *     companionPercent: number,
   *     pharmacyPercent: number,
   *     medicalLabPercent: number,
   *     otherPercent: number
   *   },
   *   kpis: {
   *     budgetBurnRatePercent: number,
   *     totalTransactionsCount: number,
   *     advancesCount: number,
   *     expensesCount: number,
   *     transfersCount: number,
   *     shiftsCount: number
   *   },
   *   updatedAt: string
   * }>}
   */
  async execute({ reservationCode }) {
    if (!reservationCode) {
      throw new DomainError('[GetSettlementBalanceQuery] reservationCode es obligatorio.');
    }

    const rva = reservationCode.trim();
    const ledger = await this.#storagePort.getSettlementLedger(rva);

    if (!ledger) {
      throw new DomainError(`[GetSettlementBalanceQuery] No se encontró el libro de liquidación para '${rva}'.`);
    }

    const currency = ledger.currency;
    const totalAdvances = ledger.totalAdvances;
    const breakdown = SettlementCalculator.calculateCategoryBreakdown({
      expenses: ledger.expenses,
      driverTransfers: ledger.driverTransfers,
      companionShifts: ledger.companionShifts,
      currency
    });

    const totalExpenses = breakdown.totalExpenses;
    const netBalance = totalAdvances.subtract(totalExpenses);
    const balanceStatus = SettlementCalculator.determineOverdraftStatus(netBalance);

    // Compute category percentage proportions for the UI balance bar
    const totalExpAmount = totalExpenses.amount;
    const calcPct = (moneyObj) => {
      if (totalExpAmount <= 0) return 0;
      return Math.round((moneyObj.amount / totalExpAmount) * 1000) / 10;
    };

    const categoryProportions = {
      taxiPercent: calcPct(breakdown.taxi),
      companionPercent: calcPct(breakdown.companion),
      pharmacyPercent: calcPct(breakdown.pharmacy),
      medicalLabPercent: calcPct(breakdown.medicalLab),
      otherPercent: calcPct(breakdown.other)
    };

    // KPI Metrics
    const totalAdvAmount = totalAdvances.amount;
    const budgetBurnRatePercent = totalAdvAmount > 0
      ? Math.round((totalExpAmount / totalAdvAmount) * 1000) / 10
      : (totalExpAmount > 0 ? 100 : 0);

    const overdraftMoney = netBalance.isNegative()
      ? netBalance.multiply(-1)
      : Money.zero(currency);

    const refundMoney = netBalance.isPositive()
      ? netBalance
      : Money.zero(currency);

    const counts = {
      advancesCount: ledger.advances.length,
      expensesCount: ledger.expenses.filter((e) => e.status !== 'REJECTED').length,
      transfersCount: ledger.driverTransfers.filter((t) => t.status !== 'CANCELLED').length,
      shiftsCount: ledger.companionShifts.filter((s) => s.status !== 'CANCELLED').length
    };

    const totalTransactionsCount =
      counts.advancesCount + counts.expensesCount + counts.transfersCount + counts.shiftsCount;

    return {
      reservationCode: rva,
      patientUuid: ledger.patientUuid,
      currency,
      totalAdvances: totalAdvances.toJSON(),
      totalExpenses: totalExpenses.toJSON(),
      netBalance: netBalance.toJSON(),
      balanceStatus,
      overdraftAmount: overdraftMoney.toJSON(),
      refundAmount: refundMoney.toJSON(),
      breakdown: {
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
      categoryProportions,
      kpis: {
        budgetBurnRatePercent,
        totalTransactionsCount,
        ...counts
      },
      updatedAt: new Date().toISOString()
    };
  }
}
