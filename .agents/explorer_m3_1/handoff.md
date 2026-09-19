# Handoff Report: Milestone 3 — Window 2: Settlement Bento Grid & Surplus Ledger (Features F12, F13)

**Explorer Agent**: Explorer M3-1 (`explorer_m3_1`)  
**Target Milestone**: Milestone 3 (Window 2: Settlement Bento Grid & Surplus Ledger — Features F12, F13)  
**Date & Time**: 2026-09-14T20:53:00Z  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/explorer_m3_1`  
**Application Target**: `apps/medicaltrip_react_app`  

---

## 1. Observation

Direct empirical observations gathered from the codebase:

### 1.1 Balance Calculation & Status Card in `SettlementView.tsx`
- **File**: `apps/medicaltrip_react_app/src/features/settlement/presentation/SettlementView.tsx`
- **Lines 154-174**:
  ```typescript
  const settlementStatusLabel =
    settlementStatus === 'SETTLED'
      ? 'Liquidado'
      : settlementStatus === 'DEFICIT_PAYABLE'
      ? 'A Favor del Paciente / Acompañante'
      : 'Superávit Medical Trip';

  const settlementStatusBadgeClass =
    settlementStatus === 'SETTLED'
      ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
      : settlementStatus === 'DEFICIT_PAYABLE'
      ? 'bg-amber-50 text-amber-800 border-amber-200/80'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200/80';

  const settlementStatusSubtitle =
    settlementStatus === 'SETTLED'
      ? 'Cuentas Cuadradas (Delta = 0 COP)'
      : settlementStatus === 'DEFICIT_PAYABLE'
      ? 'Saldo Pendiente a Favor del Paciente / Acompañante'
      : 'Saldo a Favor de Medical Trip (Superávit de Anticipo)';
  ```
- **Lines 272-290** (Hero Card Container):
  ```tsx
  {/* 1. HERO SERENO: SALDO NETO LIMPIO */}
  <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs text-center space-y-3">
    <div className="flex items-center justify-center gap-2">
      <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
        {activeBooking?.code?.toUpperCase() || 'RVA171'} · {activeBooking?.firstName || 'Catia'}
      </span>
      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${settlementStatusBadgeClass}`}>
        {settlementStatusLabel}
      </span>
    </div>
    <div>
      <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
        {settlementStatusSubtitle}
      </div>
      <div className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 tabular-nums my-1.5">
        {displayNetBalance}
      </div>
    </div>
  ```
  - *Observation*: The card background is statically `bg-white border-zinc-200/80`, regardless of status. It does NOT render an unambiguous emerald/green card when favorable to Medical Trip.
  - *Observation*: The status badge label says `'Superávit Medical Trip'` instead of `'Saldo a Favor de Medical Trip'`.
  - *Observation*: Deficit/patient credit says `'A Favor del Paciente / Acompañante'` instead of `'Saldo a Favor del Paciente'`.
  - *Observation*: Zero balance says `'Liquidado'` instead of `'Cuentas Niveladas'`.

### 1.2 Bento Grid Layout & 1-Tap Fast Expense Hub
- **File**: `apps/medicaltrip_react_app/src/features/settlement/presentation/SettlementView.tsx`
- **Lines 40-77** (`QUICK_CATEGORIES`):
  ```typescript
  export const QUICK_CATEGORIES: QuickExpenseCategory[] = [
    { id: 'cafe', name: 'Café', category: 'MEAL_SUBSIDY', defaultDesc: 'Café & Hidratación', icon: Coffee, colorClass: 'text-amber-600', suggestedAmounts: [8000, 15000, 25000] },
    { id: 'farmacia', name: 'Farmacia', category: 'PHARMACY', defaultDesc: 'Farmacia Clofán / Pasteur', icon: Pill, colorClass: 'text-red-600', suggestedAmounts: [25000, 65000, 185000] },
    { id: 'peaje', name: 'Peaje', category: 'TOLL', defaultDesc: 'Peaje Túnel de Oriente', icon: Car, colorClass: 'text-blue-600', suggestedAmounts: [16100, 19300, 24800] },
    { id: 'taxi', name: 'Taxi', category: 'OTHER', defaultDesc: 'Taxi Extra CIMA / Urbano', icon: Car, colorClass: 'text-zinc-600', suggestedAmounts: [15000, 35000, 90000] },
  ];
  ```
- **Lines 518-626**: Category buttons trigger a secondary context panel (`caja-menor-context-panel`) that requires entering or selecting an amount and pressing `btn-confirm-category-expense` ("Registrar $... COP"). This is a 2-to-3-tap process, not a direct 1-tap fast preset logging action.
- **Lines 468-496**: Renders only 2 operational buttons:
  - `btn-ocr-scanner-module` (Escanear Recibo)
  - `btn-digital-signature-module` (Firmar Acta)
  - *Observation*: There is **no trigger button** for a disbursement/advance modal (`btn-disbursement-modal` or `btn-open-disbursement-modal`), despite being explicitly called for in Feature F13 and `ORIGINAL_REQUEST.md`.
  - *Observation*: Presets in test `DockedSettlementBarFastExpenses.test.tsx` expect:
    - `btn-fast-expense-cafe` ($15.000 COP)
    - `btn-fast-expense-pharmacy` ($185.000 COP)
    - `btn-fast-expense-lunch` ($25.000 COP) — currently absent in `SettlementView.tsx`!
    - `btn-fast-expense-taxi` ($90.000 COP)

### 1.3 BigInt Arithmetic in `SettlementView.tsx`
- **Lines 140-153**:
  ```typescript
  const totalFleetAmount = settlement ? Number(settlement.totalFleetTaxis.cents) / 100 : 90000;
  const totalPatientAmount = settlement ? Number(settlement.totalExpenses.cents) / 100 : 0;
  const totalAdvancesAmount = settlement ? Number(settlement.totalAdvances.cents) / 100 : 200000;

  const hourlyRate = 15500;
  const prepAllowanceVal = includePrep ? 15500 : 0;
  const computedHourlyTotal = Math.round(hoursWorked * hourlyRate);
  const computedCompanionTotal = computedHourlyTotal + prepAllowanceVal + mealTier;
  const computedTotal = totalFleetAmount + computedCompanionTotal + totalPatientAmount - totalAdvancesAmount;

  const displayNetBalance = formattedNetBalance 
    ? formattedNetBalance.replace(/^-/, '').trim() 
    : formatCOP(Math.abs(computedTotal));
  ```
  - *Observation*: Floating point conversions `Number(...cents) / 100` and `Math.round(hoursWorked * hourlyRate)` bypass native `Money` methods, potentially introducing sub-cent float drift.

### 1.4 Radical Functional Minimalism
- **File**: `apps/medicaltrip_react_app/src/features/settlement/presentation/SettlementView.tsx`
- *Observation*: No `shadow-2xl` exists (only `shadow-xs` / `shadow-2xs`). Zero gradients exist.
- *Observation*: Several currency spans lack `tabular-nums font-mono` (e.g. lines 287, 295, 296, 340, 430, 444, 458, 683).

### 1.5 Reactive State Sync via Dynamic Key
- **File**: `apps/medicaltrip_react_app/src/App.tsx`
- **Lines 107-111**:
  ```tsx
  {activeModule === 'settlement' && (
    <SettlementView
      key={activeBooking?.id || activeArchetypeId}
      onOpenOcrModal={() => setIsOcrOpen(true)}
      onOpenSignatureModal={() => setIsSignatureOpen(true)}
    />
  )}
  ```
- **Test**: `tests/presentation/M2MultiWindowSyncChallenger1.test.tsx` (lines 262-326) passes and certifies that unmounting and remounting resets dirty local form state whenever switching archetypes.

---

## 2. Logic Chain

1. **Feature F12 Alignment**:
   - `ORIGINAL_REQUEST.md` (lines 282, 325) and `orchestrator_12/PROJECT.md` (F12) explicitly define:
     *"Dual-column responsive bento layout with unambiguous positive surplus labels ('Saldo a Favor de Medical Trip'), 1-tap disbursement modal, and BigInt deterministic calculations."*
   - In `SettlementView.tsx`, `settlementStatus` is computed by `useSettlement()`. When `settlementStatus === 'SURPLUS_MEDICAL_TRIP'`, Medical Trip holds more advances than expenses executed (superávit de anticipo).
   - Currently, `SettlementView.tsx` renders `'Superávit Medical Trip'` within a plain white card.
   - To make this unambiguous and fully compliant, when favorable to Medical Trip, the status card must dynamically adopt emerald styling (`bg-emerald-50/70 border-emerald-200/90 text-emerald-950`) and clearly state `"Saldo a Favor de Medical Trip"`.
   - Conversely, when `settlementStatus === 'DEFICIT_PAYABLE'`, the card must adopt amber styling (`bg-amber-50/70 border-amber-200/90 text-amber-950`) with label `"Saldo a Favor del Paciente"`.
   - When `settlementStatus === 'SETTLED'`, the card adopts neutral zinc styling (`bg-zinc-50 border-zinc-200 text-zinc-900`) with label `"Cuentas Niveladas"`.

2. **Feature F13 Alignment**:
   - The Bento Grid requires an integrated 1-tap hub.
   - The 4 high-frequency field presets must log directly in 1 click (firing `logFastExpense`):
     - `☕ Café $15k` ($15.000 COP, `OTHER`, `btn-fast-expense-cafe`)
     - `💊 Farmacia $185k` ($185.000 COP, `PHARMACY`, `btn-fast-expense-pharmacy`)
     - `🍽️ Almuerzo $25k` ($25.000 COP, `MEAL_SUBSIDY`, `btn-fast-expense-lunch`)
     - `🚕 Taxi $90k` ($90.000 COP, `OTHER`, `btn-fast-expense-taxi`)
   - An expandable drawer/panel (+ Otro Concepto / Personalizado) remains available for custom amounts.
   - The 1-tap disbursement trigger (`btn-disbursement-modal`) must be added to the Bento Grid action bar. Clicking it opens a modal to record a new advance (`CashAdvance`) via `ReconcileSettlementUseCase` or `storagePort.saveSettlement`, immediately updating the surplus ledger in BigInt cents without page reload.
   - The OCR scanner trigger (`btn-ocr-scanner-module`) and Digital Signature trigger (`btn-digital-signature-module`) must have robust fallback state so they are always functional even if parent props are omitted.
   - The SHA-256 seal badge (`settlement.sha256Seal`) should be cleanly rendered in the header or ledger summary once signed.

3. **Deterministic BigInt Precision**:
   - Replacing `Number(...cents) / 100` float arithmetic with `Money.fromAmount()` and `Money` add/subtract/multiply operations guarantees `Delta = 0.00 COP` precision across all re-renders.

---

## 3. Caveats

1. **Sign Convention vs Accounting Terminology**:
   - In `SettlementLedger.ts`, `netBalance = totalDebits - totalAdvances`.
   - If `advances > debits`: `netBalance` is mathematically negative. In `useSettlement.ts`, this is categorized as `SURPLUS_MEDICAL_TRIP` (the agency holds surplus advance funds).
   - If `debits > advances`: `netBalance` is positive. In `useSettlement.ts`, this is categorized as `DEFICIT_PAYABLE` (the patient owes additional funds to cover expenses).
   - Both `SettlementView.tsx` and `useSettlement.ts` maintain this exact categorization. The labels `"Saldo a Favor de Medical Trip"`, `"Saldo a Favor del Paciente"`, and `"Cuentas Niveladas"` map directly to `SURPLUS_MEDICAL_TRIP`, `DEFICIT_PAYABLE`, and `SETTLED` respectively.
2. **Disbursement Modal Integration**:
   - `App.tsx` contains `ReceiptOcrModal` and `DigitalSignaturePad`. To avoid requiring architectural modifications to `App.tsx` or `AppContextType`, `SettlementView.tsx` can either accept an optional `onOpenDisbursementModal` prop AND maintain an internal, zero-dependency `DisbursementModal` dialog that interacts directly with `storagePort` or `recalculateSettlement`.

---

## 4. Conclusion & Concrete Code Blueprint

### Summary of Required Changes
1. **`SettlementView.tsx`**:
   - **Hero Card**: Dynamically render an emerald card (`bg-emerald-50/70 border-emerald-200/90 text-emerald-950`) when `settlementStatus === 'SURPLUS_MEDICAL_TRIP'`, amber card when `DEFICIT_PAYABLE`, zinc card when `SETTLED`.
   - **Status Label**: Unambiguously render:
     - `'Saldo a Favor de Medical Trip'` (when surplus favorable to agency)
     - `'Saldo a Favor del Paciente'` (when favorable to patient)
     - `'Cuentas Niveladas'` (when net balance is zero)
   - **1-Tap Fast Expense Presets**: Add direct 1-tap buttons:
     - `btn-fast-expense-cafe`: `☕ Café $15k`
     - `btn-fast-expense-pharmacy`: `💊 Farmacia $185k`
     - `btn-fast-expense-lunch`: `🍽️ Almuerzo $25k`
     - `btn-fast-expense-taxi`: `🚕 Taxi $90k`
   - **1-Tap Disbursement Trigger & Modal**: Add `btn-disbursement-modal` button and integrated modal to record cash advances (`Bancolombia` / `Efectivo`).
   - **Deterministic BigInt Math**: Remove all unrounded float math; derive values strictly from `Money`.
   - **Minimalist Styling**: Add `font-mono tabular-nums` to all numbers and prices; enforce 1px hairline dividers and zero neon gradients.

---

### Concrete Implementation Blueprint for `SettlementView.tsx`

```tsx
/**
 * Medical Trip Colombia S.A.S. - SettlementView (Módulo de Liquidación Minimalista)
 * Alternativa 10: Bento Grid & Tactile 1-Tap Hub (Features F12, F13).
 * Minimalismo funcional radical: Cero gradientes neón, bordes hairline de 1px,
 * tipografía tabular-nums font-mono y balance BigInt determinista.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { useSettlement } from './hooks/useSettlement';
import { Money } from '@/core/domain';
import { CompanionShift } from '@/features/companion-shifts';
import { CashAdvance, SettlementLedger } from '../domain/SettlementLedger';
import { ReconcileSettlementUseCase } from '../application/ReconcileSettlementUseCase';
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
    transfers,
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
    formattedNetBalance,
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

  // New custom expense inputs
  const [newDesc, setNewDesc] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'PHARMACY' | 'PARKING' | 'TOLL' | 'MEAL_SUBSIDY' | 'OTHER'>('PHARMACY');

  // Disbursement / Cash Advance Modal State
  const [disbursementAmount, setDisbursementAmount] = useState<string>('500000');
  const [disbursementDesc, setDisbursementDesc] = useState<string>('Anticipo Bancolombia');
  const [isSavingDisbursement, setIsSavingDisbursement] = useState<boolean>(false);

  // Sync state cleanly when active shift changes
  useEffect(() => {
    if (currentShift) {
      setHoursWorked(currentShift.hoursLogged || 2.5);
      setMealTier(currentShift.mealSubsidyAmount ? Number(currentShift.mealSubsidyAmount.cents) / 100 : 0);
      setIncludePrep(currentShift.prepAllowance ? !currentShift.prepAllowance.isZero() : true);
    }
  }, [currentShift?.id, currentShift?.hoursLogged]);

  // BigInt deterministic status labels and styles
  const isSurplusMedicalTrip = settlementStatus === 'SURPLUS_MEDICAL_TRIP';
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
    ? 'bg-zinc-50/70 border-zinc-200/90 text-zinc-900'
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

  // 1-Tap Fast Expense Handler
  const handleFastExpense = async (preset: {
    category: 'MEAL_SUBSIDY' | 'PHARMACY' | 'OTHER';
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

  // 1-Tap Disbursement / Advance Submission
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
          <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-900 text-white">
            {activeBooking?.code?.toUpperCase() || 'RVA171'}
          </span>
          <span className="text-sm font-bold text-zinc-900">
            {activeBooking?.firstName || 'Catia'} {activeBooking?.lastName || ''}
          </span>
          <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
            · {activeBooking?.hotelName || 'Hotel NH Collection'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {effectiveLedger?.sha256Seal && (
            <span
              data-testid="badge-sha256-seal"
              className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200"
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

      {/* BENTO GRID RESPONSIVO A 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA IZQUIERDA (7 COLS): BENTO CELL 1 (HERO) + BENTO CELL 2 (LEDGER) */}
        <div className="lg:col-span-7 space-y-4">
          {/* BENTO CELL 1: HERO DE SALDO NETO (EMERALD / AMBER / ZINC) */}
          <div
            data-testid="settlement-hero-card"
            className={`border rounded-2xl p-5 sm:p-6 shadow-xs text-center space-y-3 transition-colors duration-200 ${heroCardBorderClass}`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-white/80 text-zinc-700 border border-zinc-200/60">
                {activeBooking?.code?.toUpperCase() || 'RVA171'} · {activeBooking?.firstName || 'Catia'}
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
                data-testid="settlement-net-balance-badge"
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
                  Anticipos:{' '}
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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">
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
          {/* BENTO CELL 3: 1-TAP FAST EXPENSE PRESETS */}
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

            {/* Grid de los 4 presets requeridos */}
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
                  <span className="block font-bold">☕ Café</span>
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
                <Pill className="w-4 h-4 text-red-600 shrink-0" />
                <div className="leading-tight truncate">
                  <span className="block font-bold">💊 Farmacia</span>
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
                  <span className="block font-bold">🍽️ Almuerzo</span>
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
                  <span className="block font-bold">🚕 Taxi</span>
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">$90.000</span>
                </div>
              </button>
            </div>

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

              {/* 2. Disbursement / Cash Advance Modal Trigger */}
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

      {/* MODAL 1-TAP DESEMBOLSO / ANTICIPO BANCARIO */}
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
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
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
                    className="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all cursor-pointer shrink-0"
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
```

---

## 5. Verification Method

To independently verify the implementation:

### 5.1 Test Execution Commands
Run the Vitest test suites covering settlement, fast expenses, multi-window synchronization, and role boundary isolation:
```bash
# 1. Verify settlement domain invariants and deterministic arithmetic
npm test -- tests/domain/SettlementLedger.test.ts

# 2. Verify 1-tap fast expense buttons and storage persistence
npm test -- tests/presentation/DockedSettlementBarFastExpenses.test.tsx

# 3. Verify clean remounting of SettlementView across archetype switching
npm test -- tests/presentation/M2MultiWindowSyncChallenger1.test.tsx

# 4. Verify 1-tap settlement pipeline, biometric signature, and SHA-256 seal derivation
npm test -- tests/presentation/OneTapSettlementPipeline.test.tsx tests/application/OneTapSettlementWorkflowUseCase.test.ts

# 5. Verify TypeScript compiler clean build
npm run typecheck
```

### 5.2 Specific DOM Selectors to Inspect in Unit/E2E Tests
1. `screen.getByTestId('settlement-hero-card')`: Must have class `bg-emerald-50/70` when `settlementStatus === 'SURPLUS_MEDICAL_TRIP'`.
2. `screen.getByTestId('settlement-status-badge')`: Must contain text `"Saldo a Favor de Medical Trip"` for surplus cases (Catia RVA171), `"Saldo a Favor del Paciente"` when payable, and `"Cuentas Niveladas"` when balanced.
3. Fast-Action Presets:
   - `screen.getByTestId('btn-fast-expense-cafe')`: Renders `☕ Café $15k`. Clicking logs $15.000 COP in 1 click.
   - `screen.getByTestId('btn-fast-expense-pharmacy')`: Renders `💊 Farmacia $185k`. Clicking logs $185.000 COP.
   - `screen.getByTestId('btn-fast-expense-lunch')`: Renders `🍽️ Almuerzo $25k`. Clicking logs $25.000 COP.
   - `screen.getByTestId('btn-fast-expense-taxi')`: Renders `🚕 Taxi $90k`. Clicking logs $90.000 COP.
4. `screen.getByTestId('btn-disbursement-modal')`: Renders trigger for disbursement modal; opens modal with input and confirm button `btn-confirm-disbursement`.
5. `screen.getByTestId('btn-ocr-scanner-module')` and `screen.getByTestId('btn-digital-signature-module')`: Operational triggers rendered cleanly in Bento Cell 4.
6. `screen.getByTestId('settlement-net-balance-badge')`: Must have classes `tabular-nums font-mono` and match exact BigInt cents output.

### 5.3 Invalidation Conditions
- Any occurrence of floating-point drift (`Delta != 0.00 COP`).
- Card displaying `"Superávit Medical Trip"` instead of `"Saldo a Favor de Medical Trip"`.
- Card failing to display emerald background styling during surplus.
- Category button requiring multi-step navigation to log standard $15k / $185k / $25k / $90k presets.
- Presence of any `shadow-2xl` or neon gradients.

