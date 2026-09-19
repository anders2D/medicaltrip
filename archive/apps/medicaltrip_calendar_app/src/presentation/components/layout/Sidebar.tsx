import React from 'react';
import { Patient } from '../../../domain/entities/Patient';
import { MedicalItinerary } from '../../../domain/aggregates/MedicalItinerary';
import { MilestoneCategory } from '../../../domain/entities/ItineraryMilestone';
import { CategoryBadge } from '../common/CategoryBadge';
import { MoneyDisplay } from '../common/MoneyDisplay';

export interface SidebarProps {
  patient: Patient;
  itinerary: MedicalItinerary;
  categoryFilter: string | null;
  onSelectCategory: (category: string | null) => void;
  onNewEvent: () => void;
  onOpenReceiptModal: () => void;
  onOpenSignatureModal: () => void;
  onOpenArchetypeModal: () => void;
  onOpenDailyReportModal?: () => void;
  onOpenSettlementSheetModal?: () => void;
}

const CATEGORIES: Array<{ key: MilestoneCategory; label: string; icon: string }> = [
  { key: 'FLIGHT', label: 'Vuelos & Traslados', icon: '✈️' },
  { key: 'CLINICAL', label: 'Citas Clínicas', icon: '🏥' },
  { key: 'LAB', label: 'Laboratorios', icon: '🔬' },
  { key: 'PHARMACY', label: 'Farmacia / Gastos', icon: '💊' },
  { key: 'HOTEL', label: 'Hotel & Reposo', icon: '🏨' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  patient,
  itinerary,
  categoryFilter,
  onSelectCategory,
  onNewEvent,
  onOpenReceiptModal,
  onOpenSignatureModal,
  onOpenArchetypeModal,
  onOpenDailyReportModal,
  onOpenSettlementSheetModal,
}) => {
  const booking = itinerary.booking;

  return (
    <aside
      className="hidden lg:flex w-64 flex-col border-r border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/60 p-4 space-y-5 overflow-y-auto flex-shrink-0"
      data-testid="app-sidebar"
    >
      {/* Patient & Booking Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300">
            {booking.code}
          </span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            🇨🇼 {patient.country}
          </span>
        </div>

        <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {patient.fullName}
        </h3>

        <div className="mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span>👥</span>
            <span>{booking.paxCount} Persona(s)</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span>🏨</span>
            <span className="truncate">{booking.hotelName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🗣️</span>
            <span>{patient.language}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenArchetypeModal}
          className="mt-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
        >
          🔄 Cambiar Caso Drive
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onNewEvent}
          className="w-full flex items-center justify-between rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 active:scale-95 transition-all"
          data-testid="sidebar-new-event-btn"
        >
          <div className="flex items-center gap-2">
            <span>＋</span>
            <span>Programar Cita</span>
          </div>
          <span className="text-[10px] opacity-75 font-mono">N</span>
        </button>

        {onOpenDailyReportModal && (
          <button
            type="button"
            onClick={onOpenDailyReportModal}
            className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 active:scale-95 transition-all"
            data-testid="sidebar-daily-report-btn"
            title="Registrar Formato Diario ACP (Atajo: R)"
          >
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span>Reporte Diario ACP</span>
            </div>
            <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              R
            </span>
          </button>
        )}

        {onOpenSettlementSheetModal && (
          <button
            type="button"
            onClick={onOpenSettlementSheetModal}
            className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 active:scale-95 transition-all"
            data-testid="sidebar-settlement-sheet-btn"
            title="Abrir Sábana Maestra de Liquidación (Atajo: L)"
          >
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>Sábana Liquidación</span>
            </div>
            <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              L
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenReceiptModal}
          className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <span>🧾</span>
            <span>Recibo OCR</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenSignatureModal}
          className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <span>✍️</span>
            <span>Firma Digital</span>
          </div>
        </button>
      </div>

      {/* Category Navigation Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
          Filtrar por Categoría
        </h4>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              categoryFilter === null
                ? 'bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
            }`}
          >
            <span>Todas las Actividades</span>
            <span className="font-mono text-[11px] text-zinc-400">
              {itinerary.milestones.length}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const count = itinerary.milestones.filter((m) => m.category === cat.key).length;
            const isSelected = categoryFilter === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : cat.key)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <span className="font-mono text-[11px] text-zinc-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Local-First Persistence Badge */}
      <div className="mt-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
          <span>💾</span>
          <span>IndexedDB Persistente</span>
        </div>
        <p className="mt-1 text-[10px] text-zinc-400">
          Anti-desalojo Safari WebKit activo con Dexie.js y Service Worker PWA.
        </p>
      </div>
    </aside>
  );
};
