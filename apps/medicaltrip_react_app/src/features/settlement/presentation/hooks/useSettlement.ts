import { useMemo, useCallback } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { Money } from '@/core/domain';
import { SettlementLedger, SettlementType } from '../../domain/SettlementLedger';

export type SettlementStatusCategory = 'DEFICIT_PAYABLE' | 'SURPLUS_MEDICAL_TRIP' | 'SETTLED';

export function useSettlement() {
  const {
    settlement,
    expenses,
    shifts,
    transfers,
    activeBooking,
    selectedDate,
    setSelectedDate,
    recalculateSettlement,
    settleExpense,
    logFastExpense,
    isLoading,
  } = useAppContext();

  // Active Date for the Daily Settlement (ISO YYYY-MM-DD)
  const activeDayDate = useMemo(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      return selectedDate.toISOString().split('T')[0];
    }
    if (activeBooking?.arrivalDate) {
      return activeBooking.arrivalDate.split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }, [selectedDate, activeBooking]);

  // Available Days of the patient stay for daily settlement navigation
  const availableDays = useMemo(() => {
    if (!activeBooking?.arrivalDate) {
      return [{ dayNumber: 1, date: activeDayDate, label: 'Día 1', formattedDate: activeDayDate }];
    }
    const start = new Date(activeBooking.arrivalDate);
    const end = activeBooking.departureDate
      ? new Date(activeBooking.departureDate)
      : new Date(start.getTime() + 4 * 86400000);
    const days: Array<{ dayNumber: number; date: string; label: string; formattedDate: string }> = [];

    const curr = new Date(start);
    let dayNum = 1;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    while (curr <= end && dayNum <= 30) {
      const dateStr = curr.toISOString().split('T')[0];
      const formattedDate = `${curr.getDate()} ${monthNames[curr.getMonth()]}`;
      days.push({
        dayNumber: dayNum,
        date: dateStr,
        label: `Día ${dayNum}`,
        formattedDate,
      });
      curr.setDate(curr.getDate() + 1);
      dayNum++;
    }
    return days.length > 0 ? days : [{ dayNumber: 1, date: activeDayDate, label: 'Día 1', formattedDate: activeDayDate }];
  }, [activeBooking, activeDayDate]);

  const activeDayNumber = useMemo(() => {
    const found = availableDays.find((d) => d.date === activeDayDate);
    return found ? found.dayNumber : 1;
  }, [availableDays, activeDayDate]);

  const setSettlementDate = useCallback(
    (targetDate: Date | string) => {
      const dateObj = typeof targetDate === 'string' ? new Date(`${targetDate}T12:00:00.000Z`) : targetDate;
      if (!isNaN(dateObj.getTime()) && setSelectedDate) {
        setSelectedDate(dateObj);
      }
    },
    [setSelectedDate]
  );

  // Filter daily operational items strictly for the active date
  const dailyExpenses = useMemo(() => {
    return expenses.filter((e) => (e.date || '').startsWith(activeDayDate));
  }, [expenses, activeDayDate]);

  const dailyShifts = useMemo(() => {
    return shifts.filter((s) => (s.date || '').startsWith(activeDayDate));
  }, [shifts, activeDayDate]);

  const dailyTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const trfDate = (t.scheduledTime || '').split('T')[0];
      return trfDate === activeDayDate;
    });
  }, [transfers, activeDayDate]);

  const dailyAdvances = useMemo(() => {
    return (settlement?.advances || []).filter((a) => (a.date || '').startsWith(activeDayDate));
  }, [settlement, activeDayDate]);

  // Compute Daily Settlement Ledger (Strictly DAILY)
  const dailySettlement = useMemo(() => {
    if (!activeBooking) return settlement;
    return SettlementLedger.calculateDaily({
      bookingId: activeBooking.code,
      date: activeDayDate,
      dayNumber: activeDayNumber,
      expenses: dailyExpenses,
      shifts: dailyShifts,
      transfers: dailyTransfers,
      advances: dailyAdvances,
      sha256Seal: settlement?.sha256Seal,
    });
  }, [activeBooking, activeDayDate, activeDayNumber, dailyExpenses, dailyShifts, dailyTransfers, dailyAdvances, settlement]);

  // Primary active settlement is strictly the daily settlement
  const effectiveSettlement = dailySettlement || settlement;

  const totalGuideHours = useMemo(() => {
    const activeList = dailyShifts.length > 0 ? dailyShifts : shifts;
    return activeList.reduce((acc, curr) => acc + (curr.hoursLogged || 0), 0);
  }, [dailyShifts, shifts]);

  const totalTransfersCount = useMemo(() => {
    const activeList = dailyTransfers.length > 0 ? dailyTransfers : transfers;
    return activeList.filter((t) => t.status !== 'CANCELLED').length;
  }, [dailyTransfers, transfers]);

  const pendingExpensesCount = useMemo(() => {
    const activeList = dailyExpenses.length > 0 ? dailyExpenses : expenses;
    return activeList.filter((e) => !e.audited).length;
  }, [dailyExpenses, expenses]);

  const settlementStatus: SettlementStatusCategory = useMemo(() => {
    if (!effectiveSettlement) return 'SETTLED';
    if (effectiveSettlement.netBalance.isPositive()) return 'DEFICIT_PAYABLE';
    if (effectiveSettlement.netBalance.isNegative()) return 'SURPLUS_MEDICAL_TRIP';
    return 'SETTLED';
  }, [effectiveSettlement]);

  const formattedNetBalance = useMemo(() => {
    if (!effectiveSettlement) return '$0 COP';
    return effectiveSettlement.netBalance.formatCOP();
  }, [effectiveSettlement]);

  const formattedTotalExpenses = useMemo(() => {
    if (!effectiveSettlement) return '$0 COP';
    return effectiveSettlement.totalExpenses.formatCOP();
  }, [effectiveSettlement]);

  const formattedTotalGuideFees = useMemo(() => {
    if (!effectiveSettlement) return '$0 COP';
    return effectiveSettlement.totalGuideFees.formatCOP();
  }, [effectiveSettlement]);

  const formattedTotalFleet = useMemo(() => {
    if (!effectiveSettlement) return '$0 COP';
    return effectiveSettlement.totalFleetTaxis.formatCOP();
  }, [effectiveSettlement]);

  const formattedTotalAdvances = useMemo(() => {
    if (!effectiveSettlement) return '$0 COP';
    return effectiveSettlement.totalAdvances.formatCOP();
  }, [effectiveSettlement]);

  const totalDebitsMoney = useMemo(() => {
    if (!effectiveSettlement) return Money.zero();
    return effectiveSettlement.totalExpenses.add(effectiveSettlement.totalGuideFees).add(effectiveSettlement.totalFleetTaxis);
  }, [effectiveSettlement]);

  const formattedTotalDebits = useMemo(() => {
    return totalDebitsMoney.formatCOP();
  }, [totalDebitsMoney]);

  // --- Companion Daily Settlement Metrics (Strictly 100% Daily) ---
  const companionDailyGuideFeesMoney = useMemo(() => {
    return dailyShifts.reduce((acc, curr) => acc.add(curr.calculateTotalFee()), Money.zero());
  }, [dailyShifts]);

  const companionDailyExpensesMoney = useMemo(() => {
    return dailyExpenses.reduce((acc, curr) => {
      if (curr.status !== 'REJECTED') {
        return acc.add(curr.amount);
      }
      return acc;
    }, Money.zero());
  }, [dailyExpenses]);

  const companionPettyCashMoney = useMemo(() => {
    const pettyCashAdv = dailyAdvances.find((a) =>
      (a.description || '').toLowerCase().includes('caja menor')
    );
    if (pettyCashAdv) return pettyCashAdv.amount;
    return Money.fromAmount(200000, 'COP');
  }, [dailyAdvances]);

  const companionPettyCashSurplusMoney = useMemo(() => {
    return companionPettyCashMoney.subtract(companionDailyExpensesMoney);
  }, [companionPettyCashMoney, companionDailyExpensesMoney]);

  const companionDailyNetPayoutMoney = useMemo(() => {
    return companionDailyGuideFeesMoney.add(companionDailyExpensesMoney).subtract(companionPettyCashMoney);
  }, [companionDailyGuideFeesMoney, companionDailyExpensesMoney, companionPettyCashMoney]);

  const formattedCompanionGuideFees = useMemo(() => {
    return companionDailyGuideFeesMoney.formatCOP();
  }, [companionDailyGuideFeesMoney]);

  const formattedCompanionExpenses = useMemo(() => {
    return companionDailyExpensesMoney.formatCOP();
  }, [companionDailyExpensesMoney]);

  const formattedCompanionPettyCash = useMemo(() => {
    return companionPettyCashMoney.formatCOP();
  }, [companionPettyCashMoney]);

  const formattedCompanionPettyCashSurplus = useMemo(() => {
    return companionPettyCashSurplusMoney.formatCOP();
  }, [companionPettyCashSurplusMoney]);

  const formattedCompanionNetPayout = useMemo(() => {
    return companionDailyNetPayoutMoney.formatCOP();
  }, [companionDailyNetPayoutMoney]);

  const companionSettlementStatus: SettlementStatusCategory = useMemo(() => {
    if (companionDailyNetPayoutMoney.isZero()) return 'SETTLED';
    if (companionDailyNetPayoutMoney.isPositive()) return 'DEFICIT_PAYABLE';
    return 'SURPLUS_MEDICAL_TRIP';
  }, [companionDailyNetPayoutMoney]);

  // Day Stepper navigation helpers
  const currentDayIndex = useMemo(() => {
    return availableDays.findIndex((d) => d.date === activeDayDate);
  }, [availableDays, activeDayDate]);

  const canGoPrevDay = currentDayIndex > 0;
  const canGoNextDay = currentDayIndex >= 0 && currentDayIndex < availableDays.length - 1;

  const goToPrevDay = useCallback(() => {
    if (canGoPrevDay && currentDayIndex > 0) {
      setSettlementDate(availableDays[currentDayIndex - 1].date);
    }
  }, [canGoPrevDay, currentDayIndex, availableDays, setSettlementDate]);

  const goToNextDay = useCallback(() => {
    if (canGoNextDay && currentDayIndex < availableDays.length - 1) {
      setSettlementDate(availableDays[currentDayIndex + 1].date);
    }
  }, [canGoNextDay, currentDayIndex, availableDays, setSettlementDate]);

  const currentDayInfo = useMemo(() => {
    return availableDays[currentDayIndex] || availableDays[0] || null;
  }, [availableDays, currentDayIndex]);

  return {
    settlement: effectiveSettlement,
    dailySettlement,
    settlementType: 'DAILY' as SettlementType,
    activeDayDate,
    activeDayNumber,
    availableDays,
    currentDayInfo,
    canGoPrevDay,
    canGoNextDay,
    goToPrevDay,
    goToNextDay,
    setSettlementDate,
    expenses: dailyExpenses.length > 0 ? dailyExpenses : expenses,
    shifts: dailyShifts.length > 0 ? dailyShifts : shifts,
    transfers: dailyTransfers.length > 0 ? dailyTransfers : transfers,
    activeBooking,
    totalGuideHours,
    totalTransfersCount,
    pendingExpensesCount,
    settlementStatus,
    formattedNetBalance,
    formattedTotalExpenses,
    formattedTotalGuideFees,
    formattedTotalFleet,
    formattedTotalAdvances,
    formattedTotalDebits,
    companionDailyGuideFeesMoney,
    companionDailyExpensesMoney,
    companionPettyCashMoney,
    companionPettyCashSurplusMoney,
    companionDailyNetPayoutMoney,
    formattedCompanionGuideFees,
    formattedCompanionExpenses,
    formattedCompanionPettyCash,
    formattedCompanionPettyCashSurplus,
    formattedCompanionNetPayout,
    companionSettlementStatus,
    recalculateSettlement,
    settleExpense,
    logFastExpense,
    isLoading,
  };
}
