/**
 * Medical Trip Colombia S.A.S. - SettlementKpiCards
 * High-density KPI cards showing real-time ledger metrics:
 * Transfers, Guide Shifts, Pharmacy Expenses, Cash Advances, and Net Balance.
 */

import React from 'react';
import { Car, Languages, Receipt, Wallet, Scale } from 'lucide-react';
import { useSettlement } from './hooks/useSettlement';
import { Badge } from '@/core/ui/Badge';

export interface SettlementKpiCardsProps {
  className?: string;
}

export const SettlementKpiCards: React.FC<SettlementKpiCardsProps> = ({ className = '' }) => {
  const {
    settlement,
    totalGuideHours,
    totalTransfersCount,
    pendingExpensesCount,
    settlementStatus,
    formattedNetBalance,
    formattedTotalExpenses,
    formattedTotalGuideFees,
    formattedTotalFleet,
    formattedTotalAdvances,
  } = useSettlement();

  const getStatusBadge = () => {
    switch (settlementStatus) {
      case 'SETTLED':
        return <Badge variant="success" size="sm" dot>Liquidado (0.00)</Badge>;
      case 'SURPLUS_MEDICAL_TRIP':
        return <Badge variant="sky" size="sm" dot>A Favor Paciente</Badge>;
      case 'DEFICIT_PAYABLE':
        return <Badge variant="danger" size="sm" dot>Cobro Pendiente</Badge>;
    }
  };

  return (
    <div
      data-testid="settlement-kpi-cards"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${className}`}
    >
      {/* 1. Flota & Traslados */}
      <div
        data-testid="kpi-transfers"
        className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-sky-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Flota y Taxis
          </span>
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
            <Car className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-base font-bold text-zinc-950 font-mono tabular-nums">
            {formattedTotalFleet}
          </div>
          <div className="text-xs text-zinc-600 mt-0.5 font-medium">
            {totalTransfersCount} {totalTransfersCount === 1 ? 'traslado programado' : 'traslados programados'}
          </div>
        </div>
      </div>

      {/* 2. Horas Guía Bilingüe */}
      <div
        data-testid="kpi-guide"
        className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-indigo-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Horas Guía
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Languages className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-base font-bold text-zinc-950 font-mono tabular-nums">
            {formattedTotalGuideFees}
          </div>
          <div className="text-xs text-zinc-600 mt-0.5 font-medium font-mono tabular-nums">
            {totalGuideHours.toFixed(1)} h guianza + subsidios
          </div>
        </div>
      </div>

      {/* 3. Gastos Farmacia / Bolsillo */}
      <div
        data-testid="kpi-expenses"
        className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Farmacia & Bolsillo
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-base font-bold text-zinc-950 font-mono tabular-nums">
            {formattedTotalExpenses}
          </div>
          <div className="text-xs text-zinc-600 mt-0.5 font-medium">
            {pendingExpensesCount > 0
              ? `${pendingExpensesCount} pendientes de auditar`
              : 'Todos los recibos auditados'}
          </div>
        </div>
      </div>

      {/* 4. Anticipos Recibidos */}
      <div
        data-testid="kpi-advances"
        className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-amber-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Anticipos Paciente
          </span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-base font-bold text-zinc-950 font-mono tabular-nums">
            {formattedTotalAdvances}
          </div>
          <div className="text-xs text-zinc-600 mt-0.5 font-medium font-mono tabular-nums">
            {settlement?.advances.length || 0} transferencias caja menor
          </div>
        </div>
      </div>

      {/* 5. Saldo Neto al Centavo */}
      <div
        data-testid="kpi-net-balance"
        className={`border rounded-xl p-3.5 flex flex-col justify-between transition-colors ${
          settlementStatus === 'SETTLED'
            ? 'bg-emerald-50/70 border-emerald-200'
            : settlementStatus === 'SURPLUS_MEDICAL_TRIP'
            ? 'bg-sky-50/70 border-sky-200'
            : 'bg-rose-50/70 border-rose-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
            Saldo Neto
          </span>
          <div className="p-1.5 rounded-lg bg-white/90 text-zinc-800 border border-zinc-200">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div
            className={`text-base font-extrabold font-mono tabular-nums ${
              settlementStatus === 'SETTLED'
                ? 'text-emerald-800'
                : settlementStatus === 'SURPLUS_MEDICAL_TRIP'
                ? 'text-sky-800'
                : 'text-rose-800'
            }`}
          >
            {formattedNetBalance}
          </div>
          <div className="mt-1 flex items-center">{getStatusBadge()}</div>
        </div>
      </div>
    </div>
  );
};
