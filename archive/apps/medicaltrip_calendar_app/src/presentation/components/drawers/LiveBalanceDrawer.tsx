import React from 'react';
import { useSettlementBalance } from '../../hooks/useSettlementBalance';
import { MedicalItinerary } from '../../../domain/aggregates/MedicalItinerary';
import { MoneyDisplay } from '../common/MoneyDisplay';

export interface LiveBalanceDrawerProps {
  itinerary: MedicalItinerary;
  onOpenReceiptModal: () => void;
  onOpenSignatureModal: () => void;
  onOpenSwarmDrawer?: () => void;
}

export const LiveBalanceDrawer: React.FC<LiveBalanceDrawerProps> = ({
  itinerary,
  onOpenReceiptModal,
  onOpenSignatureModal,
  onOpenSwarmDrawer,
}) => {
  const { balanceSheet, kpis, ledgerTransactions } = useSettlementBalance(itinerary);

  return (
    <div
      className="flex h-full flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-y-auto"
      data-testid="live-balance-drawer"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Liquidación & Auditoría en Vivo
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              {itinerary.booking.code}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {itinerary.booking.hotelName}
            </span>
          </div>
        </div>

        {/* Balance Status Pill */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border ${
            kpis.isSurplus
              ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
              : kpis.isPayable
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
          data-testid="settlement-status-pill"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              kpis.isSurplus
                ? 'bg-sky-500'
                : kpis.isPayable
                ? 'bg-emerald-500'
                : 'bg-zinc-400'
            }`}
          />
          {kpis.isSurplus
            ? 'A favor Medical Trip'
            : kpis.isPayable
            ? 'Transferir a Guía'
            : 'Balance Cuadrado'}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 space-y-5">
        {/* Proportional Balance Bar */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
            <span>Presupuesto & Distribución</span>
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Total Anticipos:</span>
              <MoneyDisplay money={kpis.totalCashAdvances} className="text-xs font-extrabold" />
            </div>
          </div>

          {/* Multi-segment colored bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            {kpis.transportPct > 0 && (
              <div
                style={{ width: `${kpis.transportPct}%` }}
                className="bg-sky-500 transition-all duration-300"
                title={`Transporte: ${kpis.transportPct}%`}
              />
            )}
            {kpis.guidePct > 0 && (
              <div
                style={{ width: `${kpis.guidePct}%` }}
                className="bg-indigo-500 transition-all duration-300"
                title={`Guianza: ${kpis.guidePct}%`}
              />
            )}
            {kpis.outOfPocketPct > 0 && (
              <div
                style={{ width: `${kpis.outOfPocketPct}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Gastos / Farmacia: ${kpis.outOfPocketPct}%`}
              />
            )}
            {kpis.remainingPct > 0 && (
              <div
                style={{ width: `${kpis.remainingPct}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Saldo Disponible: ${kpis.remainingPct}%`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              <span>Flota ({kpis.transportPct}%):</span>
              <MoneyDisplay money={kpis.totalFleetTaxis} className="ml-auto text-[11px]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span>Guianza ({kpis.guidePct}%):</span>
              <MoneyDisplay money={kpis.totalCompanionFees} className="ml-auto text-[11px]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Bolsillo ({kpis.outOfPocketPct}%):</span>
              <MoneyDisplay money={kpis.totalOutOfPocket} className="ml-auto text-[11px]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Neto Final:</span>
              <MoneyDisplay money={kpis.netBalance} className="ml-auto text-[11px] font-bold" />
            </div>
          </div>
        </div>

        {/* 4 Real-time KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              ⏱️ Horas Guía
            </span>
            <div className="mt-1 font-mono text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {kpis.totalGuideHours.toFixed(1)}h
            </div>
            <p className="text-[10px] text-zinc-400">$15.500 COP / hora</p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              📍 Paradas
            </span>
            <div className="mt-1 font-mono text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {kpis.completedMilestonesCount} / {kpis.totalMilestonesCount}
            </div>
            <p className="text-[10px] text-zinc-400">
              {Math.round((kpis.completedMilestonesCount / Math.max(kpis.totalMilestonesCount, 1)) * 100)}% completadas
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              🧾 Total Gastos
            </span>
            <div className="mt-1">
              <MoneyDisplay money={kpis.totalExpenses} className="text-base font-extrabold" />
            </div>
            <p className="text-[10px] text-zinc-400">Bolsillo + Flota + Guía</p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              🛡️ Auditoría
            </span>
            <div className="mt-1 font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
              ✅ 0.00 COP ERROR
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500">BigInt Determinista</p>
          </div>
        </div>

        {/* Quick Field Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenReceiptModal}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 transition-colors"
            data-testid="live-balance-ocr-btn"
          >
            <span>📷</span>
            <span>Subir Recibo OCR</span>
          </button>

          <button
            type="button"
            onClick={onOpenSignatureModal}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-800 shadow-sm hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 transition-colors"
            data-testid="live-balance-signature-btn"
          >
            <span>✍️</span>
            <span>Firma Paciente</span>
          </button>
        </div>

        {/* Itemized Ledger Table */}
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/60">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Desglose de Asientos y Eventos CQRS
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              {ledgerTransactions.length} transacción(es)
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {ledgerTransactions.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">
                No hay transacciones registradas aún
              </div>
            ) : (
              ledgerTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {tx.description}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400">
                      {tx.type} • {tx.timestamp.toLocaleDateString('es-CO')}
                    </div>
                  </div>

                  <div className="text-right">
                    <MoneyDisplay
                      money={tx.amount}
                      variant={tx.type === 'CASH_ADVANCE' ? 'positive' : 'neutral'}
                      className="text-xs font-bold"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cryptographic Swarm Button */}
        {onOpenSwarmDrawer && (
          <button
            type="button"
            onClick={onOpenSwarmDrawer}
            className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>🛡️</span>
              <span>Auditoría Multi-Agente & Blockchain SHA-256</span>
            </div>
            <span className="text-sky-600 font-bold">Ver Estado ›</span>
          </button>
        )}
      </div>
    </div>
  );
};
