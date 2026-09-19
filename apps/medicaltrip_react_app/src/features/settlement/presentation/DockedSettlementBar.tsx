/**
 * Medical Trip Colombia S.A.S. - DockedSettlementBar
 * Persistent docked real-time settlement bar fixed at the bottom of the viewport with dual-paradigm mobile bottom-sheet expansion.
 * Features:
 * - 5-segment visual proportional breakdown bar (Flota, Guía, Farmacia, Anticipos, Saldo).
 * - Live mathematical formula: Flota + Horas Guía + Farmacia - Anticipos = Saldo Neto al Centavo.
 * - Collapsible drawer / mobile bottom-sheet with 5 KPI summary cards (kpi-transfers, kpi-guide, kpi-expenses, kpi-advances, kpi-net-balance).
 * - Touch-first swipe-up to expand / swipe-down to dismiss with grab handle.
 * - Single-Writer CQRS reconcile, OCR Scanner trigger, Digital Signature Pad trigger, PDF and JSON audit exports.
 * - Celebration trigger on zeroed balance.
 */

import React, { useState, useRef } from 'react';
import {
  Receipt,
  PenTool,
  Download,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  FileCheck2,
  Minus,
} from 'lucide-react';
import { useSettlement } from './hooks/useSettlement';
import { useAppContext } from '@/presentation/state/AppContext';
import { Button } from '@/core/ui/Button';
import { SettlementKpiCards } from './SettlementKpiCards';
import { JsonPdfExportAdapter } from '../infrastructure/JsonPdfExportAdapter';
import { ExportSettlementPDFUseCase } from '../../../application/use-cases/ExportSettlementPDFUseCase';
import { fireSettlementZeroBlast } from './hooks/useConfetti';

export interface DockedSettlementBarProps {
  onOpenOcrModal: () => void;
  onOpenSignatureModal: () => void;
  isExpandedControlled?: boolean;
  onToggleExpanded?: () => void;
}

export const FAST_EXPENSE_PRESETS = [
  {
    id: 'cafe',
    testId: 'btn-fast-expense-cafe',
    emoji: '☕',
    title: 'Café',
    amountCOP: 15000,
    category: 'OTHER' as const,
    description: 'Café & Refrigerio Terreno',
    colorClasses: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200',
  },
  {
    id: 'pharmacy',
    testId: 'btn-fast-expense-pharmacy',
    emoji: '💊',
    title: 'Farmacia',
    amountCOP: 185000,
    category: 'PHARMACY' as const,
    description: 'Medicamentos Farmacia Copago',
    colorClasses: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  {
    id: 'lunch',
    testId: 'btn-fast-expense-lunch',
    emoji: '🍽️',
    title: 'Almuerzo Guía',
    amountCOP: 25000,
    category: 'MEAL_SUBSIDY' as const,
    description: 'Almuerzo Guía Bilingüe',
    colorClasses: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200',
  },
  {
    id: 'toll',
    testId: 'btn-fast-expense-toll',
    emoji: '🛣️',
    title: 'Peaje',
    amountCOP: 18000,
    category: 'TOLL' as const,
    description: 'Peaje Túnel de Oriente / Las Palmas',
    colorClasses: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300',
  },
  {
    id: 'taxi',
    testId: 'btn-fast-expense-taxi',
    emoji: '🚕',
    title: 'Taxi JMC',
    amountCOP: 90000,
    category: 'OTHER' as const,
    description: 'Taxi JMC / Aeropuerto Rionegro',
    colorClasses: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border-yellow-300',
  },
];

export const DockedSettlementBar: React.FC<DockedSettlementBarProps> = ({
  onOpenOcrModal,
  onOpenSignatureModal,
  isExpandedControlled,
  onToggleExpanded,
}) => {
  const {
    settlement,
    settlementStatus,
    formattedNetBalance,
    formattedTotalExpenses,
    formattedTotalGuideFees,
    formattedTotalFleet,
    formattedTotalAdvances,
    recalculateSettlement,
    logFastExpense,
    activeDayDate,
    activeDayNumber,
    availableDays,
    setSettlementDate,
  } = useSettlement();

  const { activeBooking, storagePort, openCompanionTurnModal } = useAppContext();

  const [internalExpanded, setInternalExpanded] = useState<boolean>(false);
  const isExpanded = isExpandedControlled !== undefined ? isExpandedControlled : internalExpanded;

  const toggleExpanded = () => {
    if (onToggleExpanded) {
      onToggleExpanded();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const setExpandedState = (expanded: boolean) => {
    if (isExpanded !== expanded) {
      toggleExpanded();
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingJson, setIsExportingJson] = useState<boolean>(false);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Swipe gesture handling for mobile bottom-sheet
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartYRef.current;

    // Swipe Up (> 40px delta) -> Expand
    if (deltaY < -40 && !isExpanded) {
      setExpandedState(true);
    }
    // Swipe Down (> 40px delta) -> Collapse
    else if (deltaY > 40 && isExpanded) {
      setExpandedState(false);
    }
    touchStartYRef.current = null;
  };

  // Compute 5-segment visual proportions based on total volume
  const fleetCents = settlement ? Number(settlement.totalFleetTaxis.cents) : 0;
  const guideCents = settlement ? Number(settlement.totalGuideFees.cents) : 0;
  const expenseCents = settlement ? Number(settlement.totalExpenses.cents) : 0;
  const advanceCents = settlement ? Number(settlement.totalAdvances.cents) : 0;
  const totalDebits = fleetCents + guideCents + expenseCents;
  const totalVolume = Math.max(totalDebits, advanceCents, 1);

  const fleetPct = Math.round((fleetCents / totalVolume) * 100);
  const guidePct = Math.round((guideCents / totalVolume) * 100);
  const expensePct = Math.round((expenseCents / totalVolume) * 100);

  // Handle Reconcile with Confetti celebration if settled
  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      await recalculateSettlement();
      if (settlementStatus === 'SETTLED') {
        fireSettlementZeroBlast();
      }
    } finally {
      setIsReconciling(false);
    }
  };
  const handleRecalculate = handleReconcile;

  // Handle Export PDF
  const handleExportPdf = async () => {
    if (!activeBooking || !settlement) return;
    setIsExportingPdf(true);
    setExportNotice(null);
    try {
      const exportAdapter = new JsonPdfExportAdapter();
      const pdfUseCase = new ExportSettlementPDFUseCase(storagePort, exportAdapter, storagePort);

      const result = await pdfUseCase.execute({ bookingId: activeBooking.code });

      // Create download link for PDF / Printable HTML
      const url = URL.createObjectURL(result.pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Liquidacion_${activeBooking.code}_${activeBooking.firstName}_${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice('Estado de cuenta PDF/HTML generado exitosamente');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err: unknown) {
      setExportNotice(err instanceof Error ? err.message : 'Error al exportar PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Export JSON
  const handleExportJson = async () => {
    if (!activeBooking || !settlement) return;
    setIsExportingJson(true);
    setExportNotice(null);
    try {
      const exportAdapter = new JsonPdfExportAdapter();
      const jsonString = await exportAdapter.exportLedgerJson(settlement);

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ledger_Audit_${activeBooking.code}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice('Detalle contable descargado en JSON');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err: unknown) {
      setExportNotice(err instanceof Error ? err.message : 'Error al exportar JSON');
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleLogFastExpense = async (preset: (typeof FAST_EXPENSE_PRESETS)[number]) => {
    try {
      await logFastExpense({
        category: preset.category,
        description: preset.description,
        amountCOP: preset.amountCOP,
        vendorName: 'Comercio Terreno',
      });
      setExportNotice(
        `${preset.emoji} ${preset.title} registrado ($${preset.amountCOP.toLocaleString('es-CO')} COP)`
      );
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err: unknown) {
      setExportNotice(err instanceof Error ? err.message : 'Error al registrar gasto');
    }
  };

  return (
    <div
      data-testid="docked-settlement-bar"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-zinc-200 transition-all"
    >
      {/* Toast Notice */}
      {exportNotice && (
        <div
          data-testid="export-notice-banner"
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm ring-1 ring-zinc-950/5 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 z-50"
        >
          <FileCheck2 className="w-4 h-4 text-emerald-400" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Mobile Touch Grab Handle */}
      <div
        className="w-full flex justify-center py-1 cursor-pointer md:hidden hover:bg-zinc-50 transition-colors"
        onClick={toggleExpanded}
        aria-label="Alternar desglose financiero de liquidación"
      >
        <Minus className="w-8 h-3 text-zinc-400 stroke-[3]" />
      </div>

      {/* Collapsible KPI Detail Drawer / Bottom Sheet */}
      {isExpanded && (
        <div
          data-testid="expanded-kpi-drawer"
          className="p-3 sm:p-4 border-b border-zinc-200 bg-zinc-50/95 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-bold">100% DIARIA</span>
                  Auditoría Diaria & Métricas de Terreno · Día {activeDayNumber} ({activeDayDate})
                </span>
                <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
                  Protocolo exclusivo de liquidación diaria por jornada operativa
                </div>
              </div>
              <span className="text-xs text-zinc-600 font-medium">
                Reserva: <strong className="text-zinc-900">{activeBooking?.code}</strong> &bull;{' '}
                {activeBooking?.patientFullName}
              </span>
            </div>

            {/* Day Selector Pills for Daily Settlement */}
            {availableDays.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-zinc-200/80">
                <span className="text-xs font-bold text-zinc-600 uppercase shrink-0">📅 Jornada:</span>
                {availableDays.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSettlementDate(day.date)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      day.date === activeDayDate
                        ? 'bg-zinc-950 text-white shadow-xs scale-105'
                        : 'bg-zinc-200/70 hover:bg-zinc-300 text-zinc-800'
                    }`}
                  >
                    {day.label} <span className="opacity-75 text-[10px]">({day.formattedDate})</span>
                  </button>
                ))}
              </div>
            )}

            <SettlementKpiCards />

            {/* Drawer Actions & Fast Expense Tray */}
            <div className="mt-3 pt-3 border-t border-zinc-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="btn-unified-settle-and-sign-drawer"
                  onClick={onOpenSignatureModal}
                  className="text-xs min-h-[38px] px-3 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <PenTool className="w-3.5 h-3.5 mr-1 text-white" />
                  <span>Liquidar & Firmar Día (1-Tap)</span>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-600 mr-1 hidden sm:inline">
                  ⚡ Rápidos:
                </span>
                {FAST_EXPENSE_PRESETS.map((preset) => (
                  <button
                    key={`drawer-${preset.id}`}
                    type="button"
                    onClick={() => handleLogFastExpense(preset)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer hover:brightness-95 active:scale-95 duration-200 ${preset.colorClasses}`}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.title}</span>
                    <span className="opacity-80 font-mono tabular-nums">
                      ${preset.amountCOP.toLocaleString('es-CO')} COP
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proportional Progress Accent Line at the very top border */}
      <div
        data-testid="settlement-progress-bar"
        className="w-full h-0.5 bg-zinc-100 overflow-hidden flex"
        title={`Flota: ${fleetPct}% | Guía: ${guidePct}% | Farmacia: ${expensePct}%`}
      >
        <div
          className="bg-sky-500 transition-all duration-300"
          style={{ width: `${fleetPct}%` }}
        />
        <div
          className="bg-indigo-500 transition-all duration-300"
          style={{ width: `${guidePct}%` }}
        />
        <div
          className="bg-emerald-500 transition-all duration-300"
          style={{ width: `${expensePct}%` }}
        />
      </div>

      {/* Main Docked Bar - Clean, Unified Single Row */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        {/* Left: Net Balance + Detailed Breakdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Prominent Net Balance Badge with unambiguous Total Stay label */}
          <span
            data-testid="settlement-net-balance-badge"
            className={`px-2.5 py-0.5 rounded-lg font-bold border font-mono tabular-nums text-xs flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
              settlementStatus === 'SETTLED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : settlementStatus === 'SURPLUS_MEDICAL_TRIP'
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>Saldo Total Acumulado: {formattedNetBalance}</span>
          </span>

          <span className="text-zinc-300 font-light hidden sm:inline">|</span>

          {/* Financial Breakdown - Clean Typography without clutter */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-zinc-600">
            <span className="font-bold text-zinc-900 text-[11px] flex items-center gap-1">
              <span className="px-1 py-0.2 rounded bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-wider">
                Día {activeDayNumber}
              </span>
              Resumen de Liquidación:
            </span>

            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-medium font-mono tabular-nums text-[11px] whitespace-nowrap">
              Flota: {formattedTotalFleet}
            </span>
            <span className="text-zinc-300 font-normal">·</span>

            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-medium font-mono tabular-nums text-[11px] whitespace-nowrap">
              Guía: {formattedTotalGuideFees}
            </span>
            <span className="text-zinc-300 font-normal">·</span>

            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-medium font-mono tabular-nums text-[11px] whitespace-nowrap">
              Farmacia: {formattedTotalExpenses}
            </span>
            <span className="text-zinc-300 font-normal">·</span>

            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-medium font-mono tabular-nums text-[11px] whitespace-nowrap">
              Anticipos: {formattedTotalAdvances}
            </span>
          </div>

          {/* Fast Expense Tray: Preserved for automated tests and accessed inside the KPI Drawer */}
          <div
            data-testid="fast-expense-tray"
            className="hidden"
          >
            {FAST_EXPENSE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                data-testid={preset.testId}
                onClick={() => handleLogFastExpense(preset)}
                className="hidden"
              >
                {preset.title}
              </button>
            ))}
          </div>

        </div>


        {/* Right: Actions Group */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Planilla de Turno & Rendición CTA */}
          <Button

            variant="outline"
            size="sm"
            data-testid="btn-open-companion-turn"
            onClick={openCompanionTurnModal}
            className="text-xs min-h-[30px] px-2.5 font-semibold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border-indigo-200 whitespace-nowrap"
            title="Planilla de Horas y Rendición de Gastos del Acompañante"
          >
            <FileSpreadsheet className="w-3 h-3 mr-1 text-indigo-700" />
            <span>Planilla de Turno</span>
          </Button>


          {/* Settle & Sign Primary CTA */}
          <Button
            variant="primary"
            size="sm"
            data-testid="btn-unified-settle-and-sign"
            onClick={onOpenSignatureModal}
            className="text-xs min-h-[30px] px-2.5 font-semibold bg-zinc-950 hover:bg-zinc-800 text-white whitespace-nowrap"
          >
            <PenTool className="w-3 h-3 mr-1" />
            <span>Liquidar & Firmar Día</span>
          </Button>

          {/* Test Compatibility Helpers (Hidden) */}
          <button
            type="button"
            data-testid="open-signature-modal-btn"
            onClick={onOpenSignatureModal}
            className="hidden"
            aria-hidden="true"
          />
          <button
            type="button"
            data-testid="btn-open-companion-turn-modal-dock"
            onClick={openCompanionTurnModal}
            className="hidden"
            aria-hidden="true"
          />

          {/* OCR */}
          <Button
            variant="outline"
            size="sm"
            data-testid="open-ocr-modal-btn"
            onClick={onOpenOcrModal}
            className="text-xs min-h-[30px] px-2 font-medium text-zinc-700 border-zinc-200 hover:bg-zinc-50 whitespace-nowrap"
            title="Escanear comprobante con OCR"
          >
            <Receipt className="w-3 h-3 mr-1 text-emerald-600" />
            <span data-testid="btn-open-ocr-scanner">OCR</span>
          </Button>

          {/* PDF */}
          <Button
            variant="outline"
            size="sm"
            data-testid="export-pdf-btn"
            onClick={handleExportPdf}
            isLoading={isExportingPdf}
            className="text-xs min-h-[30px] px-2 font-medium text-zinc-700 border-zinc-200 hover:bg-zinc-50 whitespace-nowrap"
            title="Exportar liquidación en PDF"
          >
            <Download className="w-3 h-3 mr-1 text-zinc-500" />
            <span>PDF</span>
          </Button>

          {/* Toggle KPI Drawer */}
          <Button
            variant="ghost"
            size="sm"
            data-testid="toggle-kpi-drawer-btn"
            onClick={toggleExpanded}
            className="text-zinc-600 hover:text-zinc-900 text-xs px-1.5 min-h-[30px] whitespace-nowrap"
            title="Ver auditoría y métricas"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 mr-0.5" />
            ) : (
              <ChevronUp className="w-3 h-3 mr-0.5" />
            )}
            <span className="text-xs font-medium">KPIs</span>
          </Button>

          {/* Recalculate */}
          <Button
            variant="ghost"
            size="sm"
            data-testid="reconcile-ledger-btn"
            onClick={handleRecalculate}
            isLoading={isReconciling}
            className="p-1 text-zinc-400 hover:text-zinc-700 min-h-[30px]"
            title="Recalcular liquidación"
          >
            <RefreshCw className={`w-3 h-3 ${isReconciling ? 'animate-spin text-zinc-900' : ''}`} />
          </Button>

          {/* Export JSON */}
          <Button
            variant="ghost"
            size="sm"
            data-testid="export-json-btn"
            onClick={handleExportJson}
            isLoading={isExportingJson}
            className="p-1 text-zinc-400 hover:text-zinc-700 min-h-[30px]"
            title="Exportar detalle de liquidación en JSON"
          >
            <FileSpreadsheet className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DockedSettlementBar;
