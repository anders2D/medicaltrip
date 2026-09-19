import { useMemo } from 'react';
import { MedicalItinerary, BalanceSheet } from '../../domain/aggregates/MedicalItinerary';
import { Money } from '../../domain/values/Money';

export interface SettlementKPIs {
  totalFleetTaxis: Money;
  totalCompanionFees: Money;
  totalOutOfPocket: Money;
  totalCashAdvances: Money;
  totalExpenses: Money;
  netBalance: Money;
  totalGuideHours: number;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  isSurplus: boolean; // Patient/Booking has credit left (A favor Medical Trip)
  isPayable: boolean; // Expenses exceed advances (Transferir a Guía)
  isBalanced: boolean;
  statusLabel: string;
  // Percentage distribution for proportional multi-segment bar
  transportPct: number;
  guidePct: number;
  outOfPocketPct: number;
  advancesPct: number;
  remainingPct: number;
}

export function calculateSettlementKPIs(itinerary: MedicalItinerary) {
  const balanceSheet: BalanceSheet = itinerary.calculateBalanceSheet();

  const totalGuideHours = itinerary.milestones.reduce((acc, m) => {
    return acc + (m.guideHours || 0);
  }, 0);

  const completedMilestonesCount = itinerary.milestones.filter(
    (m) => m.status === 'COMPLETADO'
  ).length;

  const totalMilestonesCount = itinerary.milestones.length;

  const netCents = balanceSheet.netBalance.amountInCents;
  const isSurplus = netCents < 0n; // advances exceed expenses
  const isPayable = netCents > 0n; // expenses exceed advances
  const isBalanced = netCents === 0n;

  const statusLabel = isSurplus
    ? 'A favor Medical Trip (Saldo Favorable)'
    : isPayable
    ? 'Transferir a Guía / Reembolso Pendiente'
    : 'Balance Cuadrado (0.00 COP)';

  // Compute relative proportions for visual bar
  const advancesCents = Number(balanceSheet.totalCashAdvances.amountInCents);
  const expensesCents = Number(balanceSheet.totalExpenses.amountInCents);
  const baseDenom = Math.max(advancesCents, expensesCents, 1);

  const transportCents = Number(balanceSheet.totalFleetTaxis.amountInCents);
  const guideCents = Number(balanceSheet.totalCompanionFees.amountInCents);
  const outOfPocketCents = Number(balanceSheet.totalOutOfPocket.amountInCents);

  const transportPct = Math.round((transportCents / baseDenom) * 100);
  const guidePct = Math.round((guideCents / baseDenom) * 100);
  const outOfPocketPct = Math.round((outOfPocketCents / baseDenom) * 100);
  const advancesPct = Math.round((advancesCents / baseDenom) * 100);
  const remainingPct = Math.max(0, 100 - (transportPct + guidePct + outOfPocketPct));

  const kpis: SettlementKPIs = {
    totalFleetTaxis: balanceSheet.totalFleetTaxis,
    totalCompanionFees: balanceSheet.totalCompanionFees,
    totalOutOfPocket: balanceSheet.totalOutOfPocket,
    totalCashAdvances: balanceSheet.totalCashAdvances,
    totalExpenses: balanceSheet.totalExpenses,
    netBalance: balanceSheet.netBalance,
    totalGuideHours,
    completedMilestonesCount,
    totalMilestonesCount,
    isSurplus,
    isPayable,
    isBalanced,
    statusLabel,
    transportPct,
    guidePct,
    outOfPocketPct,
    advancesPct,
    remainingPct,
  };

  const ledgerTransactions = [...itinerary.transactions].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return {
    balanceSheet,
    kpis,
    ledgerTransactions,
  };
}

export function useSettlementBalance(itinerary: MedicalItinerary) {
  return useMemo(() => {
    return calculateSettlementKPIs(itinerary);
  }, [itinerary]);
}
