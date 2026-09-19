import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Printer, Download, Plus, Trash2, Calendar, 
  DollarSign, Check, AlertTriangle, FileSpreadsheet, ChevronDown 
} from 'lucide-react';
import { Money } from '../../../domain/values/Money';
import { Guide, CompanionModality } from '../../../domain/entities/Guide';
import { AntiWithholdingSplitter } from '../common/AntiWithholdingSplitter';

export interface SettlementDayRow {
  id: string;
  dayName: string; // 'Lunes', 'Martes', etc.
  date: string; // 'YYYY-MM-DD'
  morningStart: string; // '06:00'
  morningEnd: string; // '11:00'
  afternoonStart: string; // '13:00'
  afternoonEnd: string; // '17:30'
  hoursWorked: number;
  expensesPassengerCop: number; // Gastos CM
  mealSubsidyCop: number; // Alimentación
  transportAcpCop: number; // Transporte ACP
  parkingCop: number; // Parqueadero
  hourlyRateCop: number;
}

export interface SettlementSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationCode?: string;
  patientName?: string;
  guideName?: string;
  initialModality?: CompanionModality;
}

// Historical Presets for instantaneous 1-click loading
const PRESET_RVA322_ANDRES: {
  reservationCode: string;
  patientName: string;
  guideName: string;
  modality: CompanionModality;
  advanceReceivedCop: number;
  transportBilledCop: number;
  budgetAcpCop: number;
  budgetTransportCop: number;
  rows: SettlementDayRow[];
} = {
  reservationCode: 'RVA322-1',
  patientName: 'Davinia Martis',
  guideName: 'Andres Cantero',
  modality: 'SPANISH_WITH_CAR',
  advanceReceivedCop: 100000,
  transportBilledCop: 255000,
  budgetAcpCop: 350000,
  budgetTransportCop: 320000,
  rows: [
    {
      id: 'row-1',
      dayName: 'Martes',
      date: '2026-07-14',
      morningStart: '06:00',
      morningEnd: '11:00',
      afternoonStart: '13:00',
      afternoonEnd: '17:30',
      hoursWorked: 9.5,
      expensesPassengerCop: 48600,
      mealSubsidyCop: 45000,
      transportAcpCop: 0,
      parkingCop: 16200,
      hourlyRateCop: 15500,
    },
    {
      id: 'row-2',
      dayName: 'Viernes',
      date: '2026-07-17',
      morningStart: '07:00',
      morningEnd: '13:00',
      afternoonStart: '',
      afternoonEnd: '',
      hoursWorked: 6.0,
      expensesPassengerCop: 23700,
      mealSubsidyCop: 30000,
      transportAcpCop: 0,
      parkingCop: 26000,
      hourlyRateCop: 15500,
    },
  ],
};

const PRESET_RVA171_CATIA: {
  reservationCode: string;
  patientName: string;
  guideName: string;
  modality: CompanionModality;
  advanceReceivedCop: number;
  transportBilledCop: number;
  budgetAcpCop: number;
  budgetTransportCop: number;
  rows: SettlementDayRow[];
} = {
  reservationCode: 'RVA171-4',
  patientName: 'Catia Rodrigues',
  guideName: 'Andres Cantero',
  modality: 'SPANISH_WITH_CAR',
  advanceReceivedCop: 50000,
  transportBilledCop: 70000,
  budgetAcpCop: 150000,
  budgetTransportCop: 100000,
  rows: [
    {
      id: 'row-catia-1',
      dayName: 'Miércoles',
      date: '2026-06-10',
      morningStart: '14:00',
      morningEnd: '18:00',
      afternoonStart: '',
      afternoonEnd: '',
      hoursWorked: 4.0,
      expensesPassengerCop: 8320,
      mealSubsidyCop: 25000,
      transportAcpCop: 0,
      parkingCop: 24300,
      hourlyRateCop: 15500,
    },
  ],
};

export const SettlementSheetModal: React.FC<SettlementSheetModalProps> = ({
  isOpen,
  onClose,
  reservationCode = 'RVA322-1',
  patientName = 'Davinia Martis',
  guideName = 'Andres Cantero',
  initialModality = 'SPANISH_WITH_CAR',
}) => {
  // ESC key listener for frictionless dismiss (Nielsen H3: User Control & Freedom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Form & Sheet State
  const [currentRva, setCurrentRva] = useState(reservationCode);
  const [currentPax, setCurrentPax] = useState(patientName);
  const [currentGuide, setCurrentGuide] = useState(guideName);
  const [modality, setModality] = useState<CompanionModality>(initialModality);
  const [advanceReceivedCop, setAdvanceReceivedCop] = useState<number>(100000);
  const [transportBilledCop, setTransportBilledCop] = useState<number>(255000);
  const [budgetAcpCop, setBudgetAcpCop] = useState<number>(350000);
  const [budgetTransportCop, setBudgetTransportCop] = useState<number>(320000);

  const [rows, setRows] = useState<SettlementDayRow[]>(PRESET_RVA322_ANDRES.rows);

  if (!isOpen) return null;

  // Helper to compute hours between two HH:MM strings
  const computeHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startDec = sh + sm / 60;
    let endDec = eh + em / 60;
    if (endDec < startDec) endDec += 24;
    return Math.round((endDec - startDec) * 10) / 10;
  };

  // Row update handler
  const handleUpdateRow = (id: string, field: keyof SettlementDayRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        
        // Auto-recalculate hours if times change
        if (
          field === 'morningStart' ||
          field === 'morningEnd' ||
          field === 'afternoonStart' ||
          field === 'afternoonEnd'
        ) {
          const morningH = computeHours(updated.morningStart, updated.morningEnd);
          const afternoonH = computeHours(updated.afternoonStart, updated.afternoonEnd);
          const totalH = Math.round((morningH + afternoonH) * 10) / 10;
          updated.hoursWorked = totalH;

          // Auto-calculate meal subsidy tier based on total hours
          const shiftCalc = Guide.calculateShiftFee(totalH, { modality });
          updated.mealSubsidyCop = Number(shiftCalc.mealSubsidy.amountInCents / 100n);
        }
        return updated;
      })
    );
  };

  // Add new day row
  const handleAddRow = () => {
    const newRow: SettlementDayRow = {
      id: 'row-' + Date.now(),
      dayName: 'Lunes',
      date: new Date().toISOString().split('T')[0],
      morningStart: '08:00',
      morningEnd: '12:00',
      afternoonStart: '14:00',
      afternoonEnd: '18:00',
      hoursWorked: 8.0,
      expensesPassengerCop: 0,
      mealSubsidyCop: 35000,
      transportAcpCop: 0,
      parkingCop: 0,
      hourlyRateCop: 15500,
    };
    setRows((prev) => [...prev, newRow]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Load preset
  const handleLoadPreset = (preset: typeof PRESET_RVA322_ANDRES) => {
    setCurrentRva(preset.reservationCode);
    setCurrentPax(preset.patientName);
    setCurrentGuide(preset.guideName);
    setModality(preset.modality);
    setAdvanceReceivedCop(preset.advanceReceivedCop);
    setTransportBilledCop(preset.transportBilledCop);
    setBudgetAcpCop(preset.budgetAcpCop);
    setBudgetTransportCop(preset.budgetTransportCop);
    setRows(preset.rows);
  };

  // Summary Computations (BigInt accurate)
  const totals = useMemo(() => {
    let totalHours = 0;
    let totalExpensesCm = 0;
    let totalAlimentacion = 0;
    let totalTransporteAcp = 0;
    let totalParqueadero = 0;
    let totalValorHoras = 0;

    for (const r of rows) {
      totalHours += r.hoursWorked;
      totalExpensesCm += r.expensesPassengerCop;
      totalAlimentacion += r.mealSubsidyCop;
      totalTransporteAcp += r.transportAcpCop;
      totalParqueadero += r.parkingCop;
      totalValorHoras += r.hoursWorked * r.hourlyRateCop;
    }

    // Caja Menor Total = Gastos Pasajero + Alimentación + Transporte ACP + Parqueadero
    const totalGastosCajaMenor = totalExpensesCm + totalAlimentacion + totalTransporteAcp + totalParqueadero;

    // Cuenta de Cobro = Valor Horas + Gastos Caja Menor + Transporte Billed (Traslados oficial)
    const totalCuentaDeCobro = totalValorHoras + totalGastosCajaMenor + transportBilledCop;

    // Saldo Neto a Pagar = Cuenta de Cobro - Anticipo recibido
    const saldoNetoAPagar = totalCuentaDeCobro - advanceReceivedCop;

    // Caja Menor Balance (Anticipo - Gastos)
    const saldoCajaMenor = advanceReceivedCop - totalGastosCajaMenor;

    // Budget & Utility Calculations
    const totalBudget = budgetAcpCop + budgetTransportCop;
    const totalCostMedical = totalValorHoras + transportBilledCop;
    const utilidadMedical = totalBudget - totalCostMedical;
    const margenPorcentaje = totalBudget > 0 ? (utilidadMedical / totalBudget) * 100 : 0;

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalExpensesCm,
      totalAlimentacion,
      totalTransporteAcp,
      totalParqueadero,
      totalValorHoras,
      totalGastosCajaMenor,
      totalCuentaDeCobro,
      saldoNetoAPagar,
      saldoCajaMenor,
      totalBudget,
      totalCostMedical,
      utilidadMedical,
      margenPorcentaje: Math.round(margenPorcentaje * 10) / 10,
      moneySaldoNeto: Money.fromCents(BigInt(Math.max(0, saldoNetoAPagar)) * 100n, 'COP'),
      moneyTransportBilled: Money.fromCents(BigInt(transportBilledCop) * 100n, 'COP'),
    };
  }, [rows, advanceReceivedCop, transportBilledCop, budgetAcpCop, budgetTransportCop]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const exportData = {
      formato: 'FORMATO LIQUIDACIÓN ACP',
      rva: currentRva,
      paciente: currentPax,
      acp: currentGuide,
      modalidad: modality,
      filas_diarias: rows,
      totales: totals,
      exportado_en: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Liquidacion_${currentRva}_${currentGuide.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static"
      data-testid="settlement-sheet-modal-backdrop"
    >
      <div 
        className="flex w-full max-w-5xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-auto max-h-[95vh] overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
        data-testid="settlement-sheet-dialog"
      >
        {/* Modal Top Bar - Clean minimal header with high data-ink ratio */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800 print:border-b-2 print:border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 print:hidden">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                  FORMATO LIQUIDACIÓN ACP
                </h2>
                <span className="rounded bg-sky-100 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  {currentRva}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sábana de Conciliación Mañana/Tarde · Caja Menor · Cuenta de Cobro
              </p>
            </div>
          </div>

          {/* Actions & Close */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
              title="Imprimir Sábana o Guardar como PDF"
              data-testid="print-sheet-btn"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
              title="Exportar archivo JSON normalizado"
              data-testid="export-json-sheet-btn"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 active:scale-95 transition-all"
              title="Cerrar modal (Esc)"
              data-testid="close-sheet-modal-btn"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preset Selector Banner (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/80 px-5 py-2 text-xs dark:border-zinc-800/80 dark:bg-zinc-900/60 print:hidden">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span>Cargar Plantilla Real:</span>
            <button
              type="button"
              onClick={() => handleLoadPreset(PRESET_RVA322_ANDRES)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              RVA322-1 (Andrés Cantero · 2 Días)
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset(PRESET_RVA171_CATIA)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              RVA171-4 (Catia · 1 Día)
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="flex min-h-[36px] items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-95 transition-all"
          >
            <Plus className="h-3 w-3" />
            <span>Añadir Día</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 print:p-0 print:space-y-4">
          
          {/* Header Metadata Summary (Matches Excel Layout) */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-4 text-xs">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Nombre del ACP</label>
              <input
                type="text"
                value={currentGuide}
                onChange={(e) => setCurrentGuide(e.target.value)}
                className="mt-0.5 w-full rounded border border-zinc-200 bg-transparent px-2 py-1 font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">No RVA / Pasajero</label>
              <div className="mt-0.5 flex gap-1">
                <input
                  type="text"
                  value={currentRva}
                  onChange={(e) => setCurrentRva(e.target.value)}
                  className="w-1/2 rounded border border-zinc-200 bg-transparent px-2 py-1 font-mono font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={currentPax}
                  onChange={(e) => setCurrentPax(e.target.value)}
                  className="w-1/2 rounded border border-zinc-200 bg-transparent px-2 py-1 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Modalidad Operativa</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as CompanionModality)}
                className="mt-0.5 w-full rounded border border-zinc-200 bg-transparent px-2 py-1 font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="SPANISH_WITH_CAR">ACP Español con Carro</option>
                <option value="SPANISH_WITHOUT_CAR">ACP Español sin Carro</option>
                <option value="ENGLISH_WITH_CAR_DRIVER">ACP Inglés con Carro</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Valor Base Hora</label>
              <div className="mt-0.5 flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <span>$15.500 COP</span>
                <span className="text-[10px] text-zinc-400 font-normal">Diurna</span>
              </div>
            </div>
          </div>

          {/* Master Table - The Authentic Daily Spreadsheet */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
                  <th className="py-2.5 px-3">Día</th>
                  <th className="py-2.5 px-2">Fecha</th>
                  <th className="py-2.5 px-2 text-center" colSpan={2}>Mañana</th>
                  <th className="py-2.5 px-2 text-center" colSpan={2}>Tarde</th>
                  <th className="py-2.5 px-2 text-right">Gastos CM</th>
                  <th className="py-2.5 px-2 text-right">Alimentación</th>
                  <th className="py-2.5 px-2 text-right">Transp. ACP</th>
                  <th className="py-2.5 px-2 text-right">Parqueadero</th>
                  <th className="py-2.5 px-2 text-center">Horas</th>
                  <th className="py-2.5 px-3 text-right">Valor Horas</th>
                  <th className="py-2.5 px-1 text-center print:hidden"></th>
                </tr>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] font-medium uppercase text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <th className="py-1 px-3"></th>
                  <th className="py-1 px-2"></th>
                  <th className="py-1 px-1 text-center">Desde</th>
                  <th className="py-1 px-1 text-center">Hasta</th>
                  <th className="py-1 px-1 text-center">Desde</th>
                  <th className="py-1 px-1 text-center">Hasta</th>
                  <th className="py-1 px-2 text-right">Pasajero</th>
                  <th className="py-1 px-2 text-right">Subsidio</th>
                  <th className="py-1 px-2 text-right">Zonal</th>
                  <th className="py-1 px-2 text-right">Soporte</th>
                  <th className="py-1 px-2 text-center">Laboradas</th>
                  <th className="py-1 px-3 text-right">Total</th>
                  <th className="py-1 px-1 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono tabular-nums">
                {rows.map((row) => {
                  const rowHourlyTotal = row.hoursWorked * row.hourlyRateCop;
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="py-2 px-3 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                        <input
                          type="text"
                          value={row.dayName}
                          onChange={(e) => handleUpdateRow(row.id, 'dayName', e.target.value)}
                          className="w-16 rounded bg-transparent px-1 py-0.5 text-xs font-sans font-medium focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-2 text-zinc-600 dark:text-zinc-400">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                          className="w-24 rounded bg-transparent px-1 py-0.5 text-[11px] focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="time"
                          value={row.morningStart}
                          onChange={(e) => handleUpdateRow(row.id, 'morningStart', e.target.value)}
                          className="w-16 rounded bg-transparent px-1 py-0.5 text-center text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="time"
                          value={row.morningEnd}
                          onChange={(e) => handleUpdateRow(row.id, 'morningEnd', e.target.value)}
                          className="w-16 rounded bg-transparent px-1 py-0.5 text-center text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="time"
                          value={row.afternoonStart}
                          onChange={(e) => handleUpdateRow(row.id, 'afternoonStart', e.target.value)}
                          className="w-16 rounded bg-transparent px-1 py-0.5 text-center text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="time"
                          value={row.afternoonEnd}
                          onChange={(e) => handleUpdateRow(row.id, 'afternoonEnd', e.target.value)}
                          className="w-16 rounded bg-transparent px-1 py-0.5 text-center text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-2 text-right text-zinc-700 dark:text-zinc-300">
                        <input
                          type="number"
                          value={row.expensesPassengerCop || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'expensesPassengerCop', Number(e.target.value) || 0)}
                          className="w-20 text-right rounded bg-transparent px-1 py-0.5 text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-2 text-right text-zinc-700 dark:text-zinc-300">
                        <input
                          type="number"
                          value={row.mealSubsidyCop || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'mealSubsidyCop', Number(e.target.value) || 0)}
                          className="w-20 text-right rounded bg-transparent px-1 py-0.5 text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-2 text-right text-zinc-700 dark:text-zinc-300">
                        <input
                          type="number"
                          value={row.transportAcpCop || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'transportAcpCop', Number(e.target.value) || 0)}
                          className="w-16 text-right rounded bg-transparent px-1 py-0.5 text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-2 text-right text-zinc-700 dark:text-zinc-300">
                        <input
                          type="number"
                          value={row.parkingCop || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'parkingCop', Number(e.target.value) || 0)}
                          className="w-18 text-right rounded bg-transparent px-1 py-0.5 text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-zinc-800 dark:text-zinc-200">
                        {row.hoursWorked}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                        ${rowHourlyTotal.toLocaleString('es-CO')}
                      </td>
                      <td className="py-2 px-1 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Eliminar fila de día"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Footer: Exact TOTAL Row from Excel */}
              <tfoot>
                <tr className="border-t-2 border-zinc-300 bg-zinc-100/80 font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100">
                  <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider font-sans text-xs">
                    TOTAL
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    ${totals.totalExpensesCm.toLocaleString('es-CO')}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    ${totals.totalAlimentacion.toLocaleString('es-CO')}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    ${totals.totalTransporteAcp.toLocaleString('es-CO')}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    ${totals.totalParqueadero.toLocaleString('es-CO')}
                  </td>
                  <td className="py-2.5 px-2 text-center text-sky-700 dark:text-sky-400">
                    {totals.totalHours}
                  </td>
                  <td className="py-2.5 px-3 text-right text-sky-700 dark:text-sky-400">
                    ${totals.totalValorHoras.toLocaleString('es-CO')}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Two-Column Reconciliation Section: Cuenta de Cobro vs. Caja Menor */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            
            {/* Left Box: ACP - CUENTA DE COBRO */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  ACP - CUENTA DE COBRO
                </h3>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  RVA: {currentRva}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs font-mono tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-zinc-600 dark:text-zinc-400">HORAS LABORADAS ({totals.totalHours}h):</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    ${totals.totalValorHoras.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-zinc-600 dark:text-zinc-400">GASTOS DE CAJA MENOR:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    ${totals.totalGastosCajaMenor.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-zinc-600 dark:text-zinc-400">TRANSPORTE OFICIAL:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-400">$</span>
                    <input
                      type="number"
                      value={transportBilledCop || ''}
                      onChange={(e) => setTransportBilledCop(Number(e.target.value) || 0)}
                      className="w-24 text-right rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-2 flex items-center justify-between font-bold dark:border-zinc-800">
                  <span className="font-sans text-zinc-800 dark:text-zinc-200">CUENTA DE COBRO BRUTA:</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    ${totals.totalCuentaDeCobro.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                  <span className="font-sans">Menos INGRESOS DE CAJA MENOR:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">-$</span>
                    <input
                      type="number"
                      value={advanceReceivedCop || ''}
                      onChange={(e) => setAdvanceReceivedCop(Number(e.target.value) || 0)}
                      className="w-24 text-right rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-zinc-900 pt-2.5 flex items-center justify-between text-sm font-bold dark:border-zinc-100">
                  <span className="font-sans tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                    SALDO NETO A PAGAR:
                  </span>
                  <span className="text-base text-emerald-600 dark:text-emerald-400 font-mono">
                    ${totals.saldoNetoAPagar.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Box: CAJA MENOR RECONCILIATION */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  CONTROL DE CAJA MENOR
                </h3>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Anticipos vs. Legalizado
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs font-mono tabular-nums">
                <div className="flex items-center justify-between bg-zinc-50 p-1.5 rounded dark:bg-zinc-800/40">
                  <span className="font-sans text-zinc-600 dark:text-zinc-400">ANTICIPO RECIBIDO (Ingresos):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +${advanceReceivedCop.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="pt-1 text-[11px] font-sans font-semibold text-zinc-500 uppercase tracking-wider">
                  Detalle Gastos Legalizados:
                </div>

                <div className="flex items-center justify-between pl-2">
                  <span className="font-sans text-zinc-600 dark:text-zinc-400">• Gastos para el pasajero:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">${totals.totalExpensesCm.toLocaleString('es-CO')}</span>
                </div>

                <div className="flex items-center justify-between pl-2">
                  <span className="font-sans text-zinc-600 dark:text-zinc-400">• Alimentación Sub ACP:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">${totals.totalAlimentacion.toLocaleString('es-CO')}</span>
                </div>

                <div className="flex items-center justify-between pl-2">
                  <span className="font-sans text-zinc-600 dark:text-zinc-400">• Transporte ACP:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">${totals.totalTransporteAcp.toLocaleString('es-CO')}</span>
                </div>

                <div className="flex items-center justify-between pl-2">
                  <span className="font-sans text-zinc-600 dark:text-zinc-400">• Parqueaderos:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">${totals.totalParqueadero.toLocaleString('es-CO')}</span>
                </div>

                <div className="border-t border-zinc-200 pt-2 flex items-center justify-between font-bold dark:border-zinc-800">
                  <span className="font-sans text-zinc-800 dark:text-zinc-200">TOTAL GASTOS CAJA MENOR:</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    -${totals.totalGastosCajaMenor.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="border-t-2 border-zinc-900 pt-2.5 flex items-center justify-between text-xs font-bold dark:border-zinc-100">
                  <span className="font-sans text-zinc-800 dark:text-zinc-200">BALANCE CAJA MENOR:</span>
                  <span className={`font-mono ${totals.saldoCajaMenor >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {totals.saldoCajaMenor >= 0 ? 'A favor empresa: ' : 'A favor ACP: '}
                    ${Math.abs(totals.saldoCajaMenor).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Presupuesto Medical Trip & Rentabilidad */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2.5">
              PRESUPUESTO PAGO ACP &amp; RENTABILIDAD OPERATIVA
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-mono tabular-nums">
              <div className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                <span className="text-[10px] font-sans text-zinc-500 uppercase">Cobrado Presupuesto ACP</span>
                <div className="mt-1 font-bold text-zinc-800 dark:text-zinc-200">
                  ${budgetAcpCop.toLocaleString('es-CO')}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                <span className="text-[10px] font-sans text-zinc-500 uppercase">Cobrado Transporte Pax</span>
                <div className="mt-1 font-bold text-zinc-800 dark:text-zinc-200">
                  ${budgetTransportCop.toLocaleString('es-CO')}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                <span className="text-[10px] font-sans text-zinc-500 uppercase">Costo Total Pagado</span>
                <div className="mt-1 font-bold text-zinc-800 dark:text-zinc-200">
                  ${totals.totalCostMedical.toLocaleString('es-CO')}
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                <span className="text-[10px] font-sans font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  Utilidad Medical ({totals.margenPorcentaje}%)
                </span>
                <div className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  +${totals.utilidadMedical.toLocaleString('es-CO')}
                </div>
              </div>
            </div>
          </div>

          {/* Anti-Withholding Splitter - Automatically shown when Net Balance > $523.700 COP */}
          <div className="print:hidden">
            <AntiWithholdingSplitter
              reservationCode={currentRva}
              guideName={currentGuide}
              totalNetBalance={totals.moneySaldoNeto}
              totalTransportCost={totals.moneyTransportBilled}
              destinationAccount="379-194776-96"
            />
          </div>

        </div>

        {/* Footer actions for Mobile / Desktop */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/90 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/90 print:hidden">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            Formato oficial estandarizado según libro maestro de liquidaciones 2026.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial min-h-[44px] rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 active:scale-95 transition-all"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial min-h-[44px] items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 active:scale-95 transition-all flex justify-center"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Liquidación</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
