import React, { useState, useEffect, useMemo } from 'react';
import {
  ItineraryMilestone,
  MilestoneCategory,
  MilestoneFinancialType,
  MilestoneStatus,
} from '../../../domain/entities/ItineraryMilestone';
import { Money } from '../../../domain/values/Money';
import { OperativeTerritory } from '../../../domain/values/OperativeTerritory';
import { CategoryBadge } from '../common/CategoryBadge';
import { MoneyDisplay } from '../common/MoneyDisplay';
import { InvariantErrorAlert } from '../common/InvariantErrorAlert';

export interface EventDetailDrawerProps {
  isOpen: boolean;
  milestone: ItineraryMilestone | null;
  onClose: () => void;
  onSave: (milestoneId: string | null, formData: any) => void;
  onDelete?: (milestoneId: string) => void;
  onGpsCheckIn?: (milestone: ItineraryMilestone) => void;
  onOpenReceiptModal?: (milestone: ItineraryMilestone) => void;
  onOpenSignatureModal?: (milestone: ItineraryMilestone) => void;
}

const PROVIDER_PRESETS = [
  { name: 'Hospital Pablo Tobón Uribe (HPTU)', location: 'Robledo, Medellín', category: 'CLINICAL' },
  { name: 'Clínica Clofán (Torre Médica)', location: 'Ciudad del Río, Medellín', category: 'CLINICAL' },
  { name: 'Clínica Cardio VID', location: 'Robledo, Medellín', category: 'CLINICAL' },
  { name: 'Clínica CES Sede Oviedo Piso 6', location: 'El Poblado, Medellín', category: 'CLINICAL' },
  { name: 'Clínica CES Prado Centro', location: 'Prado Centro, Medellín', category: 'CLINICAL' },
  { name: 'CIMA Ayudas Diagnósticas', location: 'Cra 44, Medellín', category: 'LAB' },
  { name: 'Laboratorio Echavarría Domicilio', location: 'Hotel Inntu Laureles', category: 'LAB' },
  { name: 'Centro Diagnóstico Hernán Ocazionez', location: 'El Poblado, Medellín', category: 'LAB' },
  { name: 'Droguería Cruz Verde Robledo', location: 'Robledo, Medellín', category: 'PHARMACY' },
  { name: 'Farmacia Pasteur Laureles', location: 'Laureles, Medellín', category: 'PHARMACY' },
  { name: 'Hotel Inntu Laureles', location: 'Segundo Parque de Laureles', category: 'HOTEL' },
  { name: 'Edificio Park 42 Poblado', location: 'Sector Manila / Astorga', category: 'HOTEL' },
  { name: 'Hotel Novelty Suites', location: 'Milla de Oro, Poblado', category: 'HOTEL' },
  { name: 'Aeropuerto JMC Rionegro', location: 'Rionegro, Antioquia', category: 'FLIGHT' },
];

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  isOpen,
  milestone,
  onClose,
  onSave,
  onDelete,
  onGpsCheckIn,
  onOpenReceiptModal,
  onOpenSignatureModal,
}) => {
  const isEditing = Boolean(milestone);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MilestoneCategory>('CLINICAL');
  const [startDate, setStartDate] = useState('2026-08-20');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('Hospital Pablo Tobón Uribe (HPTU)');
  const [providerName, setProviderName] = useState('Hospital Pablo Tobón Uribe');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [assignedGuideId, setAssignedGuideId] = useState('');
  const [assignedNurseId, setAssignedNurseId] = useState('');
  const [financialType, setFinancialType] = useState<MilestoneFinancialType>('NONE');
  const [costAmountCOP, setCostAmountCOP] = useState<number>(0);
  const [guideHours, setGuideHours] = useState<number>(2);
  const [status, setStatus] = useState<MilestoneStatus>('PROGRAMADO');
  const [notes, setNotes] = useState('');
  const [requiresGpsCheckIn, setRequiresGpsCheckIn] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [requiresReceipt, setRequiresReceipt] = useState(false);
  const [territoryError, setTerritoryError] = useState<string | null>(null);

  // Sync state when milestone prop changes
  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setCategory(milestone.category);
      setStartDate(milestone.startDateTime.toISOString().split('T')[0]);
      setStartTime(
        milestone.startDateTime.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
      setEndTime(
        milestone.endDateTime.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
      setLocation(milestone.location.rawName);
      setProviderName(milestone.providerName || '');
      setAssignedDriverId(milestone.assignedDriverId || '');
      setAssignedGuideId(milestone.assignedGuideId || '');
      setAssignedNurseId(milestone.assignedNurseId || '');
      setFinancialType(milestone.financialType);
      setCostAmountCOP(milestone.cost.units);
      setGuideHours(milestone.guideHours || 0);
      setStatus(milestone.status);
      setNotes(milestone.notes || '');
      setRequiresGpsCheckIn(Boolean(milestone.requiresGpsCheckIn));
      setRequiresSignature(Boolean(milestone.requiresSignature));
      setRequiresReceipt(Boolean(milestone.requiresReceipt));
      setTerritoryError(null);
    } else {
      // Create defaults
      setTitle('');
      setCategory('CLINICAL');
      setStartDate('2026-08-20');
      setStartTime('09:00');
      setEndTime('11:00');
      setLocation('Hospital Pablo Tobón Uribe (HPTU)');
      setProviderName('Hospital Pablo Tobón Uribe');
      setAssignedDriverId('');
      setAssignedGuideId('GUIA-01');
      setAssignedNurseId('');
      setFinancialType('GUIDE_FEE');
      setCostAmountCOP(31000);
      setGuideHours(2);
      setStatus('PROGRAMADO');
      setNotes('');
      setRequiresGpsCheckIn(false);
      setRequiresSignature(false);
      setRequiresReceipt(false);
      setTerritoryError(null);
    }
  }, [milestone, isOpen]);

  // Live Settlement Delta Calculation
  const settlementDelta = useMemo(() => {
    let guideCost = 0;
    if (financialType === 'GUIDE_FEE' && guideHours > 0) {
      guideCost = guideHours * 15500;
    }
    const directCost = costAmountCOP || 0;
    const totalImpact = Math.max(guideCost, directCost);
    return Money.fromUnits(totalImpact, 'COP');
  }, [financialType, guideHours, costAmountCOP]);

  const handleLocationChange = (val: string) => {
    setLocation(val);
    try {
      new OperativeTerritory(val);
      setTerritoryError(null);
    } catch (err: any) {
      setTerritoryError(err.message || 'Territorio no operativo para Medical Trip');
    }
  };

  const handleProviderSelect = (prov: (typeof PROVIDER_PRESETS)[0]) => {
    setProviderName(prov.name);
    setLocation(prov.name + ' - ' + prov.location);
    setCategory(prov.category as MilestoneCategory);
    try {
      new OperativeTerritory(prov.location);
      setTerritoryError(null);
    } catch (err: any) {
      setTerritoryError(err.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate territory
      new OperativeTerritory(location);
      setTerritoryError(null);

      const startDateTimeStr = `${startDate}T${startTime}:00.000Z`;
      const endDateTimeStr = `${startDate}T${endTime}:00.000Z`;

      onSave(milestone ? milestone.id : null, {
        title,
        category,
        startDateTime: startDateTimeStr,
        endDateTime: endDateTimeStr,
        location,
        providerName,
        assignedDriverId: assignedDriverId || undefined,
        assignedGuideId: assignedGuideId || undefined,
        assignedNurseId: assignedNurseId || undefined,
        financialType,
        costAmountCOP: settlementDelta.units,
        guideHours: financialType === 'GUIDE_FEE' ? guideHours : undefined,
        status,
        notes,
        requiresGpsCheckIn,
        requiresSignature,
        requiresReceipt,
      });

      onClose();
    } catch (err: any) {
      setTerritoryError(err.message || 'Error de invariante de territorio');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-zinc-900/40 backdrop-blur-sm transition-opacity"
      data-testid="event-detail-drawer"
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-zinc-900 dark:border-l dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {isEditing ? 'Detalle del Evento Clínico' : 'Nueva Cita Médica / Traslado'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
            data-testid="drawer-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Territory Error Alert */}
        {territoryError && (
          <div className="p-4 border-b border-rose-100 dark:border-rose-900">
            <InvariantErrorAlert error={territoryError} onDismiss={() => setTerritoryError(null)} />
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Título de la Actividad
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Consulta Oftalmología Clofán..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              data-testid="drawer-input-title"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Categoría de Servicio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                ['CLINICAL', 'LAB', 'FLIGHT', 'PHARMACY', 'HOTEL', 'LOGISTICS'] as MilestoneCategory[]
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all ${
                    category === cat
                      ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <CategoryBadge category={cat} size="sm" showIcon={false} />
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Fecha (America/Bogota)
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Inicio (Hora)
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Fin (Hora)
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Quick Provider Preset */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Proveedor / Destino Predefinido
            </label>
            <select
              onChange={(e) => {
                const found = PROVIDER_PRESETS.find((p) => p.name === e.target.value);
                if (found) handleProviderSelect(found);
              }}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Seleccionar de la red oficial de aliados...</option>
              {PROVIDER_PRESETS.map((p, idx) => (
                <option key={idx} value={p.name}>
                  {p.name} ({p.location})
                </option>
              ))}
            </select>
          </div>

          {/* Location String & Fail-Fast Validator */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Ubicación / Territorio Operativo
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className={`w-full rounded-lg border px-3.5 py-2 text-xs font-medium dark:bg-zinc-800 dark:text-zinc-100 ${
                territoryError
                  ? 'border-rose-500 bg-rose-50/50'
                  : 'border-zinc-300 bg-white dark:border-zinc-700'
              }`}
              placeholder="Ej: Clínica Clofán Ciudad del Río, Medellín..."
              data-testid="drawer-input-location"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              🛡️ Geocerca activa: Medellín, Rionegro JMC, Envigado, Sabaneta. Zonas como Mocoa o Leticia son rechazadas.
            </p>
          </div>

          {/* Staff Assignment */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                🚗 Conductor [DRV]
              </label>
              <select
                value={assignedDriverId}
                onChange={(e) => setAssignedDriverId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white p-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Sin Asignar</option>
                <option value="DRV-01">Ramón Rosero (Aeroturex)</option>
                <option value="DRV-02">Juan Carlos (Kia Soul)</option>
                <option value="DRV-03">Andrés (Van Uber XL)</option>
                <option value="DRV-04">Gustavo Mora (Duster)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                🗣️ Guía [GUIA]
              </label>
              <select
                value={assignedGuideId}
                onChange={(e) => setAssignedGuideId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white p-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Sin Asignar</option>
                <option value="GUIA-01">Yenny Roberto (ACP Lead)</option>
                <option value="GUIA-02">Alejandro (Inglés Clínico)</option>
                <option value="GUIA-03">Liliana Bilingüe</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                🩺 Enfermera [NURSE]
              </label>
              <select
                value={assignedNurseId}
                onChange={(e) => setAssignedNurseId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white p-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Sin Asignar</option>
                <option value="NURSE-01">Emi Echavarría (Domicilio)</option>
                <option value="NURSE-02">Enfermera Post-Op</option>
              </select>
            </div>
          </div>

          {/* Financial Type & Settlement Impact */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              📈 Impacto en Liquidación Financiera (Real-Time Settlement Delta)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                  Tipo de Costo
                </label>
                <select
                  value={financialType}
                  onChange={(e) => setFinancialType(e.target.value as MilestoneFinancialType)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="NONE">Sin Costo / Incluido en Paquete</option>
                  <option value="GUIDE_FEE">Honorarios Guía ($15.500/h)</option>
                  <option value="FLEET_TAXI">Traslado Flota / Transporte</option>
                  <option value="OUT_OF_POCKET">Gasto Bolsillo / Farmacia</option>
                </select>
              </div>

              {financialType === 'GUIDE_FEE' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                    Horas de Guianza
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={guideHours}
                    onChange={(e) => setGuideHours(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-300 bg-white p-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                    Monto Directo (COP)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={costAmountCOP}
                    onChange={(e) => setCostAmountCOP(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-300 bg-white p-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Variación Neta en Ledger:
              </span>
              <MoneyDisplay
                money={settlementDelta}
                variant="neutral"
                className="text-sm font-extrabold text-sky-700 dark:text-sky-300"
              />
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Estado de la Actividad
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="PROGRAMADO">🔵 PROGRAMADO (En espera)</option>
              <option value="EN_CAMINO">🟡 EN CAMINO (Conductor / Guía en ruta)</option>
              <option value="EN_SITIO">🟣 EN SITIO (Check-in validado)</option>
              <option value="COMPLETADO">🟢 COMPLETADO (Cerrado con soporte)</option>
              <option value="CANCELADO">⚪ CANCELADO (Contingencia)</option>
            </select>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Notas & Instrucciones de Campo
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ayuno 8 horas, llevar pasaportes originales..."
              className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Action Modals Triggers (When editing) */}
          {isEditing && milestone && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              {onGpsCheckIn && (
                <button
                  type="button"
                  onClick={() => onGpsCheckIn(milestone)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  📍 Check-in GPS
                </button>
              )}
              {onOpenReceiptModal && (
                <button
                  type="button"
                  onClick={() => onOpenReceiptModal(milestone)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  🧾 Subir Recibo
                </button>
              )}
              {onOpenSignatureModal && (
                <button
                  type="button"
                  onClick={() => onOpenSignatureModal(milestone)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  ✍️ Firma Paciente
                </button>
              )}
            </div>
          )}

          {/* Actions Bottom Bar */}
          <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {isEditing && onDelete && milestone ? (
              <button
                type="button"
                onClick={() => onDelete(milestone.id)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                data-testid="drawer-delete-btn"
              >
                🗑️ Eliminar
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 focus:outline-none"
                data-testid="drawer-save-btn"
              >
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
