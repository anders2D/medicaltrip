import React, { useState, useMemo } from 'react';
import { 
  X, Clock, Car, Receipt, Plus, Trash2, CheckCircle2, 
  MapPin, AlertCircle, Sparkles, Moon, Calendar, ChevronRight
} from 'lucide-react';
import { Money } from '../../../domain/values/Money';
import { Guide, CompanionModality } from '../../../domain/entities/Guide';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationCode?: string;
  patientName?: string;
  defaultGuideName?: string;
  onSaveReport?: (reportData: any) => void;
}

interface TransferItem {
  id: string;
  origin: string;
  destination: string;
  costCop: number;
}

interface ExpenseEntry {
  id: string;
  category: 'pasajero' | 'acp' | 'parqueaderos' | 'uber';
  description: string;
  amountCop: number;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  reservationCode = 'RVA171-4',
  patientName = 'Catia Rodrigues',
  defaultGuideName = 'Andres Cantero',
  onSaveReport,
}) => {
  if (!isOpen) return null;

  // Form State
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [modality, setModality] = useState<CompanionModality>('SPANISH_WITH_CAR');
  const [isSundayOrHoliday, setIsSundayOrHoliday] = useState<boolean>(false);
  const [hasPrepAllowance, setHasPrepAllowance] = useState<boolean>(false);
  const [hasDeliveryAllowance, setHasDeliveryAllowance] = useState<boolean>(false);

  // Transfers
  const [transfers, setTransfers] = useState<TransferItem[]>([
    { id: 'tr-1', origin: 'CC Oviedo (Poblado)', destination: 'INNTU Hotel (Laureles)', costCop: 35000 },
    { id: 'tr-2', origin: 'INNTU Hotel (Laureles)', destination: 'Clínica Clofán (Poblado)', costCop: 35000 },
  ]);

  // Expenses in 4 Buckets
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([
    { id: 'exp-1', category: 'parqueaderos', description: 'Parqueadero Clínica Clofán', amountCop: 24300 },
    { id: 'exp-2', category: 'pasajero', description: '4 tarritos de muestra Orina/Coprológico', amountCop: 8320 },
  ]);

  // Quick inputs
  const [newOrigin, setNewOrigin] = useState('');
  const [newDest, setNewDest] = useState('');
  const [newTransferRate, setNewTransferRate] = useState<number>(35000);

  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState<string>('');
  const [newExpCat, setNewExpCat] = useState<'pasajero' | 'acp' | 'parqueaderos' | 'uber'>('pasajero');

  // Compute worked hours and night hours
  const { totalHours, nightHours, isNightShift } = useMemo(() => {
    if (!startTime || !endTime) return { totalHours: 0, nightHours: 0, isNightShift: false };
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let startDec = sh + sm / 60;
    let endDec = eh + em / 60;
    if (endDec < startDec) endDec += 24; // crossing midnight
    const dur = Math.max(0, Math.round((endDec - startDec) * 100) / 100);

    // Night hours after 19:00 (7:00 pm)
    let night = 0;
    if (endDec > 19) {
      night = Math.min(dur, endDec - Math.max(19, startDec));
    }

    return { totalHours: dur, nightHours: Math.round(night * 100) / 100, isNightShift: endDec >= 20 };
  }, [startTime, endTime]);

  // Calculate fees via domain entity
  const calculation = useMemo(() => {
    return Guide.calculateShiftFee(totalHours, {
      modality,
      nightHours,
      isSundayOrHoliday,
      hasPrepAllowance,
      hasDeliveryAllowance,
      applyMinimumHoursFloor: true,
    });
  }, [totalHours, modality, nightHours, isSundayOrHoliday, hasPrepAllowance, hasDeliveryAllowance]);

  // Aggregate expenses
  const totalExpensesCop = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.amountCop || 0), 0);
  }, [expenses]);

  const totalTransfersCop = useMemo(() => {
    return transfers.reduce((acc, curr) => acc + (curr.costCop || 0), 0);
  }, [transfers]);

  // Transfer presets
  const handleAddTransfer = () => {
    if (!newOrigin.trim() || !newDest.trim()) return;
    setTransfers((prev) => [
      ...prev,
      {
        id: 'tr-' + Date.now(),
        origin: newOrigin.trim(),
        destination: newDest.trim(),
        costCop: newTransferRate || 30000,
      },
    ]);
    setNewOrigin('');
    setNewDest('');
  };

  const handleRemoveTransfer = (id: string) => {
    setTransfers((prev) => prev.filter((t) => t.id !== id));
  };

  // Expense helpers
  const handleAddExpense = () => {
    const val = Number(newExpAmount);
    if (!newExpDesc.trim() || isNaN(val) || val <= 0) return;
    setExpenses((prev) => [
      ...prev,
      {
        id: 'exp-' + Date.now(),
        category: newExpCat,
        description: newExpDesc.trim(),
        amountCop: val,
      },
    ]);
    setNewExpDesc('');
    setNewExpAmount('');
  };

  const handleApplyPreset = (desc: string, amount: number, cat: 'pasajero' | 'acp' | 'parqueaderos' | 'uber') => {
    setExpenses((prev) => [
      ...prev,
      {
        id: 'exp-' + Date.now(),
        category: cat,
        description: desc,
        amountCop: amount,
      },
    ]);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      formato: 'FORMATO DIARIO ACP',
      rva: reservationCode,
      paciente: patientName,
      acp: defaultGuideName,
      fecha: reportDate,
      tiempo_laborado: {
        inicio: startTime,
        fin: endTime,
        total_horas: totalHours,
        night_hours: nightHours,
      },
      calculo_honorarios: calculation,
      traslados_carro_acp: transfers,
      gastos: expenses,
      totales: {
        honorarios_cop: calculation.totalFee.units,
        traslados_cop: totalTransfersCop,
        gastos_caja_menor_cop: totalExpensesCop,
        gran_total_dia_cop: calculation.totalFee.units + totalTransfersCop + totalExpensesCop,
      },
    };

    if (onSaveReport) {
      onSaveReport(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                {reservationCode}
              </span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Formato Diario ACP
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {patientName} &bull; Guía: {defaultGuideName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Modalidad & Fecha */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Fecha del Acompañamiento
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Modalidad Operativa del ACP
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as CompanionModality)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="SPANISH_WITH_CAR">Español con Carro Propio ($15.5k)</option>
                <option value="SPANISH_WITHOUT_CAR">Español sin Carro (Zonal/Uber)</option>
                <option value="ENGLISH_WITH_CAR_DRIVER">Inglés con Carro (Degresiva $40k-$25k + Traslados)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Tiempo Laborado */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Tiempo Laborado
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400">
                  {totalHours.toFixed(1)} hrs laboradas
                </span>
                {nightHours > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-mono font-medium text-indigo-700 dark:text-indigo-400">
                    <Moon className="h-3 w-3" /> {nightHours.toFixed(1)}h noche
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-end">
              <div>
                <label className="block text-[11px] text-zinc-500">Hora Inicio</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500">Hora Finalización</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isSundayOrHoliday}
                    onChange={(e) => setIsSundayOrHoliday(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span>Domingo / Festivo (+1h)</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={hasPrepAllowance}
                    onChange={(e) => setHasPrepAllowance(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span>Carpeta (Alistamiento)</span>
                </label>
              </div>
            </div>

            {/* Compensation Preview */}
            <div className="mt-3.5 pt-3 border-t border-zinc-200/60 flex flex-wrap items-center justify-between gap-2 text-xs dark:border-zinc-800">
              <span className="text-zinc-500">Subsidio Alimentación Auto:</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                {calculation.mealSubsidy.format()} (Nivel {calculation.mealTier})
              </span>
              <span className="text-zinc-400">&bull;</span>
              <span className="text-zinc-500">Honorarios Turno:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {calculation.totalFee.format()}
              </span>
            </div>
          </div>

          {/* Section 3: Traslados en Carro Propio */}
          {modality !== 'SPANISH_WITHOUT_CAR' && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Traslados en Carro del ACP
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400">
                  Subtotal: ${totalTransfersCop.toLocaleString()} COP
                </span>
              </div>

              {/* Transfers List */}
              <div className="space-y-2">
                {transfers.map((tr) => (
                  <div
                    key={tr.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{tr.origin}</span>
                      <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{tr.destination}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        ${tr.costCop.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTransfer(tr.id)}
                        className="text-zinc-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Transfer Inline */}
              <div className="mt-3 pt-3 border-t border-zinc-200/60 grid grid-cols-1 gap-2 sm:grid-cols-4 items-end dark:border-zinc-800">
                <input
                  type="text"
                  placeholder="Punto recogida (ej. Hotel Portón)"
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="text"
                  placeholder="Punto destino (ej. Clofán)"
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <select
                  value={newTransferRate}
                  onChange={(e) => setNewTransferRate(Number(e.target.value))}
                  className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value={30000}>$30.000 (Urbano Corto)</option>
                  <option value={35000}>$35.000 (Poblado-Laureles)</option>
                  <option value={40000}>$40.000 (Belén-Poblado)</option>
                  <option value={45000}>$45.000 (Robledo/HPTU)</option>
                  <option value={200000}>$200.000 (Aeropuerto JMC)</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddTransfer}
                  className="flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </button>
              </div>
            </div>
          )}

          {/* Section 4: Gastos de Caja Menor (4 Buckets) */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Gastos de Caja Menor
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400">
                Subtotal: ${totalExpensesCop.toLocaleString()} COP
              </span>
            </div>

            {/* Presets 1-clic */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-zinc-500">Presets 1-toque:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('Sim Card y Recarga Claro', 15000, 'pasajero')}
                className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                + $15k SIM Claro
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Tarritos de muestra orina/coprológico', 8320, 'pasajero')}
                className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                + $8.3k Tarritos
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Electrolit Hidratación', 7700, 'pasajero')}
                className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                + $7.7k Electrolit
              </button>
            </div>

            {/* Expense entries list */}
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {exp.category}
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200">{exp.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      ${exp.amountCop.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(exp.id)}
                      className="text-zinc-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add expense inline */}
            <div className="mt-3 pt-3 border-t border-zinc-200/60 grid grid-cols-1 gap-2 sm:grid-cols-4 items-end dark:border-zinc-800">
              <select
                value={newExpCat}
                onChange={(e) => setNewExpCat(e.target.value as any)}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="pasajero">Pasajero (Farmacia/Compras)</option>
                <option value="parqueaderos">Parqueaderos</option>
                <option value="acp">ACP (Viáticos propios)</option>
                <option value="uber">Uber nocturno / especial</option>
              </select>
              <input
                type="text"
                placeholder="Descripción del gasto"
                value={newExpDesc}
                onChange={(e) => setNewExpDesc(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="number"
                placeholder="Valor en COP"
                value={newExpAmount}
                onChange={(e) => setNewExpAmount(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddExpense}
                className="flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Plus className="h-3.5 w-3.5" /> Registrar
              </button>
            </div>
          </div>

          {/* Sticky Summary Bar */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-100/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-850">
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div>
                <span className="block text-[10px] text-zinc-500">Honorarios Horas:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {calculation.totalFee.format()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500">Traslados Carro:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  ${totalTransfersCop.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500">Gastos Caja Menor:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  ${totalExpensesCop.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500">Gran Total Día:</span>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ${(calculation.totalFee.units + totalTransfersCop + totalExpensesCop).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Guardar Reporte Diario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
