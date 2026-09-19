/**
 * Medical Trip Colombia S.A.S. - SettlementView (Módulo de Liquidación Minimalista)
 * Alternativa 10: Bento Grid & Tactile 1-Tap Hub (Features F12, F13).
 * Minimalismo funcional radical: Cero gradientes neón, bordes hairline de 1px,
 * tipografía tabular-nums font-mono y balance BigInt determinista con Delta = 0.00 COP.
 */

import React, { useState } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { useSettlement } from './hooks/useSettlement';
import { Money } from '@/core/domain';
import { CompanionShift } from '@/features/companion-shifts';
import { CashAdvance } from '../domain/SettlementLedger';
import { ReconcileSettlementUseCase } from '../application/ReconcileSettlementUseCase';
import { HotelAccountSplitCard } from './HotelAccountSplitCard';
import {
  Camera,
  FileCheck,
  Plus,
  Minus,
  Car,
  UserCheck,
  Receipt,
  Landmark,
  ShieldCheck,
  Coffee,
  Pill,
  Utensils,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  CreditCard,
} from 'lucide-react';

export interface QuickExpenseCategory {
  id: string;
  name: string;
  category: 'MEAL_SUBSIDY' | 'PHARMACY' | 'TOLL' | 'OTHER';
  defaultDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  suggestedAmounts: number[];
}

export const QUICK_CATEGORIES: QuickExpenseCategory[] = [
  {
    id: 'cafe',
    name: 'Café',
    category: 'MEAL_SUBSIDY',
    defaultDesc: 'Café & Hidratación',
    icon: Coffee,
    colorClass: 'text-amber-600',
    suggestedAmounts: [8000, 15000, 25000],
  },
  {
    id: 'farmacia',
    name: 'Farmacia',
    category: 'PHARMACY',
    defaultDesc: 'Farmacia Clofán / Pasteur',
    icon: Pill,
    colorClass: 'text-red-600',
    suggestedAmounts: [25000, 65000, 185000],
  },
  {
    id: 'peaje',
    name: 'Peaje',
    category: 'TOLL',
    defaultDesc: 'Peaje Túnel de Oriente',
    icon: Car,
    colorClass: 'text-blue-600',
    suggestedAmounts: [16100, 19300, 24800],
  },
  {
    id: 'taxi',
    name: 'Taxi',
    category: 'OTHER',
    defaultDesc: 'Taxi Extra CIMA / Urbano',
    icon: Car,
    colorClass: 'text-zinc-600',
    suggestedAmounts: [15000, 35000, 90000],
  },
];

export interface SettlementViewProps {
  onOpenOcrModal?: () => void;
  onOpenSignatureModal?: () => void;
  onOpenDisbursementModal?: () => void;
}

export const SettlementView: React.FC<SettlementViewProps> = ({
  onOpenOcrModal,
  onOpenSignatureModal,
  onOpenDisbursementModal,
}) => {
  const {
    activeBooking,
    expenses,
    shifts,
    settlement: contextSettlement,
    storagePort,
    logFastExpense,
    saveCompanionShift,
    refreshData,
    recalculateSettlement,
  } = useAppContext();

  const {
    settlement,
    settlementStatus,
    formattedTotalExpenses,
    formattedTotalGuideFees,
    formattedTotalFleet,
    formattedTotalAdvances,
  } = useSettlement();

  // Local shift state for interactive companion hours editor
  const currentShift = shifts[0];
  const [hoursWorked, setHoursWorked] = useState<number>(currentShift?.hoursLogged || 2.5);
  const [mealTier, setMealTier] = useState<number>(
    currentShift?.mealSubsidyAmount ? Number(currentShift.mealSubsidyAmount.cents) / 100 : 0
  );
  const [includePrep, setIncludePrep] = useState<boolean>(
    currentShift?.prepAllowance ? !currentShift.prepAllowance.isZero() : true
  );
  const [isShiftEditorOpen, setIsShiftEditorOpen] = useState<boolean>(false);
  const [isCustomExpenseOpen, setIsCustomExpenseOpen] = useState<boolean>(false);
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [fastExpenseNotice, setFastExpenseNotice] = useState<string | null>(null);

  // Quick category drawer state (M2 compatibility)
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [catExpenseAmount, setCatExpenseAmount] = useState<string>('');
  const [catExpenseCustomDesc, setCatExpenseCustomDesc] = useState<string>('');

  // New custom expense inputs
  const [newDesc, setNewDesc] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'PHARMACY' | 'PARKING' | 'TOLL' | 'MEAL_SUBSIDY' | 'OTHER'>('PHARMACY');

  // Disbursement / Cash Advance Modal State
  const [disbursementAmount, setDisbursementAmount] = useState<string>('500000');
  const [disbursementDesc, setDisbursementDesc] = useState<string>('Anticipo Bancolombia');
  const [isSavingDisbursement, setIsSavingDisbursement] = useState<boolean>(false);

  // BigInt deterministic status labels and styles (Feature F12)
  const isDeficitPatient = settlementStatus === 'DEFICIT_PAYABLE';
  const isSettled = settlementStatus === 'SETTLED';

  const settlementStatusLabel = isSettled
    ? 'Cuentas Niveladas'
    : isDeficitPatient
    ? 'Saldo a Favor del Paciente'
    : 'Saldo a Favor de Medical Trip';

  const settlementStatusSubtitle = isSettled
    ? 'Balance Exacto al Centavo (Delta = $0 COP)'
    : isDeficitPatient
    ? 'Reembolso Pendiente por Liquidar al Paciente'
    : 'Superávit de Anticipo en Custodia (Medical Trip)';

  const heroCardBorderClass = isSettled
    ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
    : isDeficitPatient
    ? 'bg-amber-50/70 border-amber-200/90 text-amber-950'
    : 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950';

  const settlementStatusBadgeClass = isSettled
    ? 'bg-zinc-100 text-zinc-700 border-zinc-300'
    : isDeficitPatient
    ? 'bg-amber-100/90 text-amber-800 border-amber-300/80'
    : 'bg-emerald-100/90 text-emerald-800 border-emerald-300/80';

  // Deterministic Money Calculations (0 Floating-Point Drift)
  const effectiveLedger = settlement || contextSettlement;
  const netBalanceMoney = effectiveLedger ? effectiveLedger.netBalance : Money.zero();
  const displayNetBalance = netBalanceMoney.formatCOP().replace(/^-/, '').trim();

  const totalDebitsMoney = effectiveLedger
    ? effectiveLedger.totalExpenses.add(effectiveLedger.totalGuideFees).add(effectiveLedger.totalFleetTaxis)
    : Money.zero();
  const totalAdvancesMoney = effectiveLedger ? effectiveLedger.totalAdvances : Money.zero();

  // 1-Tap Fast Expense Handler (Feature F13)
  const handleFastExpense = async (preset: {
    category: 'MEAL_SUBSIDY' | 'PHARMACY' | 'TOLL' | 'OTHER';
    description: string;
    amountCOP: number;
  }) => {
    try {
      await logFastExpense({
        category: preset.category,
        description: preset.description,
        amountCOP: preset.amountCOP,
      });
      setFastExpenseNotice(`${preset.description} ($${preset.amountCOP.toLocaleString('es-CO')} COP) registrado`);
      setTimeout(() => setFastExpenseNotice(null), 3000);
    } catch (err) {
      console.error('Error logging fast expense:', err);
    }
  };

  // 1-Tap Disbursement / Advance Submission (Feature F13)
  const handleSaveDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking) return;
    const cleanNum = parseFloat(disbursementAmount.replace(/[^0-9]/g, ''));
    if (isNaN(cleanNum) || cleanNum <= 0) return;

    setIsSavingDisbursement(true);
    try {
      const reconcileUseCase = new ReconcileSettlementUseCase(storagePort);
      const newAdvance: CashAdvance = {
        id: `adv-${Date.now()}`,
        date: new Date().toISOString(),
        amount: Money.fromAmount(cleanNum, 'COP'),
        description: disbursementDesc.trim() || 'Anticipo Bancolombia',
      };
      await reconcileUseCase.execute({
        bookingId: activeBooking.code,
        additionalAdvances: [newAdvance],
      });
      await refreshData();
      if (recalculateSettlement) {
        await recalculateSettlement();
      }
      setIsDisbursementModalOpen(false);
      setFastExpenseNotice(`Anticipo de $${cleanNum.toLocaleString('es-CO')} COP registrado con éxito`);
      setTimeout(() => setFastExpenseNotice(null), 3000);
    } catch (err) {
      console.error('Error saving advance:', err);
    } finally {
      setIsSavingDisbursement(false);
    }
  };

  // Companion Shift Hours Save
  const handleSaveShift = async () => {
    if (currentShift) {
      const updatedShift = new CompanionShift({
        id: currentShift.id,
        bookingId: currentShift.bookingId,
        guideId: currentShift.guideId,
        guideName: currentShift.guideName,
        dayNumber: currentShift.dayNumber,
        date: currentShift.date,
        hoursLogged: hoursWorked,
        hourlyRate: currentShift.hourlyRate,
        prepAllowance: includePrep ? CompanionShift.DEFAULT_PREP_ALLOWANCE_COP : Money.zero(),
        mealSubsidyAmount: Money.fromAmount(mealTier, 'COP'),
        notes: currentShift.notes,
        status: currentShift.status,
      });
      await saveCompanionShift(updatedShift);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 select-none pb-28 sm:pb-24 space-y-5">
      {/* 0. CONTEXT HEADER: PACIENTE Y MOTOR DETERMINISTA */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-900 text-white tabular-nums">
            {activeBooking?.code?.toUpperCase() || 'RVA171'}
          </span>
          <span className="text-sm font-bold text-zinc-900">
            {activeBooking?.firstName || 'Natalie'} {activeBooking?.lastName || 'Rumai'}
          </span>
          <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
            · {activeBooking?.hotelName || 'Hotel NH Collection'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {effectiveLedger?.sha256Seal && (
            <span
              data-testid="badge-sha256-seal"
              className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 tabular-nums"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>SHA-256: {effectiveLedger.sha256Seal.substring(0, 10)}...</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Motor Determinista BigInt</span>
          </span>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {fastExpenseNotice && (
        <div
          data-testid="export-notice-banner"
          className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-medium flex items-center justify-between animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{fastExpenseNotice}</span>
          </div>
          <button type="button" onClick={() => setFastExpenseNotice(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BENTO GRID RESPONSIVO A 2 COLUMNAS (Feature F13) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA IZQUIERDA (7 COLS): BENTO CELL 1 (HERO) + BENTO CELL 2 (LEDGER) */}
        <div className="lg:col-span-7 space-y-4">
          {/* BENTO CELL 1: HERO DE SALDO NETO DINÁMICO (Feature F12) */}
          <div
            data-testid="settlement-hero-card"
            className={`border rounded-2xl p-5 sm:p-6 shadow-xs text-center space-y-3 transition-colors duration-200 ${heroCardBorderClass}`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-white/80 text-zinc-700 border border-zinc-200/60 tabular-nums">
                {activeBooking?.code?.toUpperCase() || 'RVA350-1'} · {activeBooking?.firstName || 'Natalie'}
              </span>
              <span
                data-testid="settlement-status-badge"
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${settlementStatusBadgeClass}`}
              >
                {settlementStatusLabel}
              </span>
            </div>

            <div>
              <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                {settlementStatusSubtitle}
              </div>
              <div
                data-testid="settlement-view-net-balance"
                className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 tabular-nums font-mono my-1.5"
              >
                {displayNetBalance}
              </div>
            </div>

            {/* Barra Visual de Balance */}
            <div className="pt-2 border-t border-zinc-200/60 text-left space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
                <span>
                  Débitos:{' '}
                  <strong className="text-zinc-900 font-semibold font-mono tabular-nums">
                    {totalDebitsMoney.formatCOP()}
                  </strong>
                </span>
                <span>
                  Anticipos Totales:{' '}
                  <strong className="text-emerald-700 font-semibold font-mono tabular-nums">
                    {totalAdvancesMoney.formatCOP()}
                  </strong>
                </span>
              </div>
              <div className="w-full bg-zinc-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    netBalanceMoney.cents <= 0n ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        8,
                        totalAdvancesMoney.cents > 0n
                          ? Math.round(Number((totalDebitsMoney.cents * 100n) / totalAdvancesMoney.cents))
                          : 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* BENTO CELL 2: LEDGER CONTABLE DE 4 CONCEPTOS */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Desglose Contable Diario
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold tabular-nums">
                Delta = $0 COP
              </span>
            </div>

            <div className="divide-y divide-zinc-100 text-xs">
              {/* Fila 1: Acompañamiento Físico */}
              <div className="py-2.5 px-1 space-y-2">
                <button
                  type="button"
                  data-testid="row-toggle-shift-editor"
                  onClick={() => setIsShiftEditorOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between cursor-pointer hover:bg-zinc-50/80 -mx-1 px-1 py-1 rounded-lg transition-colors select-none text-left"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-zinc-500" />
                    <div>
                      <span className="font-semibold text-zinc-900">Acompañamiento Físico</span>
                      <span className="text-[11px] text-zinc-500 block">{hoursWorked}h presenciales + subsidio</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-950 tabular-nums font-mono text-sm">
                      {formattedTotalGuideFees || '$ 0 COP'}
                    </span>
                    <span className="p-1 rounded-md text-zinc-400">
                      {isShiftEditorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </button>

                {/* Sub-panel colapsable de horas */}
                {isShiftEditorOpen && (
                  <div className="mt-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-700">Horas en Clínica:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHoursWorked((prev) => Math.max(0, +(prev - 0.5).toFixed(1)))}
                          data-testid="btn-hours-minus"
                          className="w-7 h-7 rounded-lg bg-white border border-zinc-300 flex items-center justify-center font-bold text-zinc-700 active:scale-95 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-12 text-center font-mono font-bold text-zinc-900 text-sm tabular-nums">
                          {hoursWorked}h
                        </span>
                        <button
                          type="button"
                          onClick={() => setHoursWorked((prev) => +(prev + 0.5).toFixed(1))}
                          data-testid="btn-hours-plus"
                          className="w-7 h-7 rounded-lg bg-white border border-zinc-300 flex items-center justify-center font-bold text-zinc-700 active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                      <span className="font-medium text-zinc-700">Subsidio Comida:</span>
                      <div className="flex gap-1">
                        {[
                          { label: '$0', val: 0 },
                          { label: '$8k', val: 8000 },
                          { label: '$25k', val: 25000 },
                          { label: '$35k', val: 35000 },
                        ].map((tier) => (
                          <button
                            key={tier.val}
                            type="button"
                            onClick={() => setMealTier(tier.val)}
                            className={`px-2 py-0.5 text-[10px] rounded-md font-semibold transition-all cursor-pointer font-mono tabular-nums ${
                              mealTier === tier.val
                                ? 'bg-zinc-900 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-700'
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-700">
                        <input
                          type="checkbox"
                          checked={includePrep}
                          onChange={(e) => setIncludePrep(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-zinc-900 border-zinc-300 cursor-pointer"
                        />
                        <span>Hora Preparación ($15.500 COP)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveShift}
                        data-testid="btn-save-companion-hours"
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
                      >
                        {savedSuccess ? '¡Guardado!' : 'Aplicar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Fila 2: Flota Privada Aeroturex */}
              <div className="py-2.5 px-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-zinc-500" />
                  <div>
                    <span className="font-semibold text-zinc-900">Flota Privada Aeroturex</span>
                    <span className="text-[11px] text-zinc-500 block">Traslados aeropuerto y clínicas</span>
                  </div>
                </div>
                <span className="font-bold text-zinc-950 tabular-nums font-mono text-sm">
                  {formattedTotalFleet || '$ 0 COP'}
                </span>
              </div>

              {/* Fila 3: Gastos de Caja Menor */}
              <div className="py-2.5 px-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-zinc-500" />
                  <div>
                    <span className="font-semibold text-zinc-900">Gastos de Caja Menor</span>
                    <span className="text-[11px] text-zinc-500 block">{expenses.length} recibos auditados</span>
                  </div>
                </div>
                <span className="font-bold text-zinc-950 tabular-nums font-mono text-sm">
                  {formattedTotalExpenses || '$ 0 COP'}
                </span>
              </div>

              {/* Fila 4: Anticipos Recibidos */}
              <div className="py-2.5 px-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-zinc-900">Anticipos Recibidos</span>
                    <span className="text-[11px] text-emerald-600 block">Consignación Bancolombia / Efectivo</span>
                  </div>
                </div>
                <span className="font-bold text-emerald-700 tabular-nums font-mono text-sm">
                  - {formattedTotalAdvances || '$ 0 COP'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (5 COLS): BENTO CELL 3 (FAST EXPENSES) + BENTO CELL 4 (ACTIONS) + BENTO CELL 5 (CONCILIAR) */}
        <div className="lg:col-span-5 space-y-4">
          {/* BENTO CELL 3: 1-TAP FAST EXPENSE PRESETS & CATEGORY HUB (Feature F13) */}
          <div
            data-testid="fast-expense-tray"
            className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                  Caja Menor 1-Tap
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Registra gastos frecuentes con 1 toque</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomExpenseOpen(!isCustomExpenseOpen)}
                className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                {isCustomExpenseOpen ? 'Cerrar' : '+ Otro Concepto'}
              </button>
            </div>

            {/* Grid de los presets directos */}
            <div className="grid grid-cols-2 gap-2">
              {/* 1. Café $15k */}
              <button
                type="button"
                data-testid="btn-fast-expense-cafe"
                onClick={() =>
                  handleFastExpense({ category: 'OTHER', description: 'Café & Hidratación', amountCOP: 15000 })
                }
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-95 text-left"
              >
                <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="leading-tight truncate">
                  <span className="block font-bold">Café e Hidratación</span>
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">$15.000</span>
                </div>
              </button>

              {/* 2. Farmacia $185k */}
              <button
                type="button"
                data-testid="btn-fast-expense-pharmacy"
                onClick={() =>
                  handleFastExpense({ category: 'PHARMACY', description: 'Farmacia Clofán / Pasteur', amountCOP: 185000 })
                }
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-95 text-left"
              >
                <Pill className="w-4 h-4 text-rose-600 shrink-0" />
                <div className="leading-tight truncate">
                  <span className="block font-bold">Medicamentos Farmacia</span>
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">$185.000</span>
                </div>
              </button>

              {/* 3. Almuerzo $25k */}
              <button
                type="button"
                data-testid="btn-fast-expense-lunch"
                onClick={() =>
                  handleFastExpense({ category: 'MEAL_SUBSIDY', description: 'Almuerzo Guía / Acompañante', amountCOP: 25000 })
                }
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-95 text-left"
              >
                <Utensils className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="leading-tight truncate">
                  <span className="block font-bold">Almuerzo en Turno</span>
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">$25.000</span>
                </div>
              </button>

              {/* 4. Taxi $90k */}
              <button
                type="button"
                data-testid="btn-fast-expense-taxi"
                onClick={() =>
                  handleFastExpense({ category: 'OTHER', description: 'Taxi Extra CIMA / Aeropuerto', amountCOP: 90000 })
                }
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-95 text-left"
              >
                <Car className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="leading-tight truncate">
                  <span className="block font-bold">Taxi o Transporte Extra</span>
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">$90.000</span>
                </div>
              </button>

              {/* 5. Peaje $18k */}
              <button
                type="button"
                data-testid="btn-fast-expense-toll"
                onClick={() =>
                  handleFastExpense({ category: 'TOLL', description: 'Peaje Túnel de Oriente', amountCOP: 18000 })
                }
                className="col-span-2 flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>Peaje Túnel de Oriente</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums font-bold">$18.000</span>
              </button>
            </div>

            {/* Quick Categories Bar (M2 Test Support) */}
            <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`btn-quick-cat-${cat.id}`}
                  onClick={() => {
                    if (selectedCatId === cat.id) {
                      setSelectedCatId(null);
                    } else {
                      setSelectedCatId(cat.id);
                      setCatExpenseAmount(cat.suggestedAmounts[1].toString());
                      setCatExpenseCustomDesc(cat.defaultDesc);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer shrink-0 ${
                    selectedCatId === cat.id
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200/80'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Context panel for quick category */}
            {selectedCatId && (
              <div
                data-testid="caja-menor-context-panel"
                className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2.5 mt-2 animate-fade-in text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">
                    Detalle: {QUICK_CATEGORIES.find((c) => c.id === selectedCatId)?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCatId(null)}
                    className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={catExpenseAmount}
                    onChange={(e) => setCatExpenseAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Monto"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono tabular-nums outline-none"
                  />
                  <button
                    type="button"
                    data-testid="btn-confirm-category-expense"
                    onClick={async () => {
                      const num = parseFloat(catExpenseAmount);
                      if (!isNaN(num) && num > 0) {
                        const catObj = QUICK_CATEGORIES.find((c) => c.id === selectedCatId)!;
                        await handleFastExpense({
                          category: catObj.category,
                          description: catExpenseCustomDesc || catObj.defaultDesc,
                          amountCOP: num,
                        });
                        setSelectedCatId(null);
                      }
                    }}
                    className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 cursor-pointer active:scale-95"
                  >
                    Registrar
                  </button>
                </div>
              </div>
            )}

            {/* Expansor de gasto personalizado */}
            {isCustomExpenseOpen && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newDesc.trim() || !newAmount) return;
                  const cleanNum = parseFloat(newAmount.replace(/[^0-9]/g, ''));
                  if (isNaN(cleanNum) || cleanNum <= 0) return;
                  await handleFastExpense({ category: newCategory as any, description: newDesc.trim(), amountCOP: cleanNum });
                  setNewDesc('');
                  setNewAmount('');
                  setIsCustomExpenseOpen(false);
                }}
                className="pt-2 grid grid-cols-1 sm:grid-cols-12 gap-1.5 border-t border-zinc-100"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Descripción (ej. Peaje)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Valor COP"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs outline-none tabular-nums font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-1.5 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white text-zinc-700 outline-none"
                  >
                    <option value="PHARMACY">Farmacia</option>
                    <option value="MEAL_SUBSIDY">Comida</option>
                    <option value="TOLL">Peaje</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    data-testid="btn-add-expense-custom"
                    className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 text-white font-semibold text-xs cursor-pointer active:scale-95"
                  >
                    + Guardar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* BENTO CELL 4: 1-TAP OPERATIONAL ACTION BAR (OCR, DISBURSEMENT, SIGNATURE) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider block px-1">
              Acciones Operativas en Terreno
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 1. OCR Scanner */}
              <button
                type="button"
                onClick={onOpenOcrModal}
                data-testid="btn-ocr-scanner-module"
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-98 border border-zinc-200/80"
              >
                <Camera className="w-3.5 h-3.5 text-zinc-600" />
                <span>Escanear OCR</span>
              </button>

              {/* 2. Disbursement / Cash Advance Modal Trigger (Feature F13) */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenDisbursementModal) {
                    onOpenDisbursementModal();
                  } else {
                    setIsDisbursementModalOpen(true);
                  }
                }}
                data-testid="btn-disbursement-modal"
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-98 border border-zinc-200/80"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Desembolso</span>
              </button>

              {/* 3. Digital Signature Modal */}
              <button
                type="button"
                onClick={onOpenSignatureModal}
                data-testid="btn-digital-signature-module"
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all cursor-pointer active:scale-98 shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firmar Acta</span>
              </button>
            </div>
          </div>

          {/* BENTO CELL 5: CIERRE Y CONCILIACIÓN */}
          <div>
            <button
              type="button"
              onClick={handleSaveShift}
              data-testid="btn-save-settlement-main"
              className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Guardar & Conciliar — <span className="font-mono tabular-nums">{displayNetBalance}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. SECCIÓN SISTEMATIZADA: DESGLOSE DE PAGO DE HOTEL & VOUCHER WHATSAPP */}
      <HotelAccountSplitCard booking={activeBooking} />

      {/* MODAL 1-TAP DESEMBOLSO / ANTICIPO BANCARIO (Feature F13) */}
      {isDisbursementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-fade-in">
          <div
            data-testid="disbursement-modal-card"
            className="bg-white border border-zinc-200/90 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-xs space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">Registrar Desembolso / Anticipo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDisbursementModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDisbursement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Monto en Pesos (COP):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={disbursementAmount}
                    onChange={(e) => setDisbursementAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="500000"
                    className="w-full pl-7 pr-12 py-2 rounded-xl border border-zinc-200 text-base font-bold font-mono text-zinc-900 tabular-nums outline-none focus:border-zinc-900"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">
                    COP
                  </span>
                </div>
              </div>

              {/* Presets rápidos de anticipo */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[200000, 500000, 1000000, 1200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDisbursementAmount(amt.toString())}
                    className="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all cursor-pointer shrink-0 tabular-nums"
                  >
                    ${(amt / 1000).toLocaleString('es-CO')}k
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Concepto / Referencia:</label>
                <input
                  type="text"
                  value={disbursementDesc}
                  onChange={(e) => setDisbursementDesc(e.target.value)}
                  placeholder="Anticipo Transferencia Bancolombia"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisbursementModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingDisbursement}
                  data-testid="btn-confirm-disbursement"
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  {isSavingDisbursement ? 'Guardando...' : 'Confirmar Anticipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
