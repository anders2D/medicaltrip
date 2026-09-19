import React, { useState, useMemo } from 'react';
import { ItineraryEvent, FinancialExpenseType } from '../domain/ItineraryEvent';
import { EventCategoryType } from '../domain/EventCategory';
import { EventStatusType } from '../domain/EventStatus';
import { OperativeTerritory } from '../../../domain/value-objects/OperativeTerritory';
import { Money } from '../../../domain/value-objects/Money';
import {
  CLINICAL_PROVIDERS,
  ACCOMMODATION_PROVIDERS,
  FLEET_DRIVERS,
  FIELD_STAFF,
  FieldStaffInfo,
  FleetDriverInfo,
} from '../../../infrastructure/data/providers.data';
import { GUIDE_RATES, FLEET_RATES } from '../../../infrastructure/data/rates.data';
import { Input } from '@/core/ui/Input';
import { Select } from '@/core/ui/Select';
import { Button } from '@/core/ui/Button';
import { Clock, DollarSign, Save, ShieldAlert } from 'lucide-react';

export interface EventFormProps {
  initialEvent?: ItineraryEvent | null;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  bookingId: string;
  onSave: (eventData: {
    id?: string;
    bookingId: string;
    dayNumber: number;
    title: string;
    category: EventCategoryType;
    startDateTime: string;
    endDateTime: string;
    location: OperativeTerritory;
    providerId?: string;
    providerName?: string;
    assignedDriverId?: string;
    assignedGuideId?: string;
    assignedNurseId?: string;
    financialType: FinancialExpenseType;
    cost: Money;
    guideHours?: number;
    status: EventStatusType;
    requiresGpsCheckIn: boolean;
    requiresSignature: boolean;
    requiresReceipt: boolean;
    notes: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  initialEvent,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  bookingId,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  // Extract initial date / times
  const initialDateStr = useMemo(() => {
    if (initialEvent) {
      return new Date(initialEvent.startDateTime).toISOString().split('T')[0];
    }
    return defaultDate || new Date().toISOString().split('T')[0];
  }, [initialEvent, defaultDate]);

  const initialStartStr = useMemo(() => {
    if (initialEvent) {
      const d = new Date(initialEvent.startDateTime);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return defaultStartTime || '09:00';
  }, [initialEvent, defaultStartTime]);

  const initialEndStr = useMemo(() => {
    if (initialEvent) {
      const d = new Date(initialEvent.endDateTime);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return defaultEndTime || '10:30';
  }, [initialEvent, defaultEndTime]);

  // Form States
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [category, setCategory] = useState<EventCategoryType>(initialEvent?.category || 'CLINICAL');
  const [date, setDate] = useState(initialDateStr);
  const [startTime, setStartTime] = useState(initialStartStr);
  const [endTime, setEndTime] = useState(initialEndStr);
  const [dayNumber, setDayNumber] = useState(initialEvent?.dayNumber || 1);

  const [locationAddress, setLocationAddress] = useState(
    initialEvent?.location ? initialEvent.location.address : 'Hospital Pablo Tobon Uribe Robledo'
  );
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const [providerId, setProviderId] = useState(initialEvent?.providerId || '');
  const [providerName, setProviderName] = useState(initialEvent?.providerName || '');
  const [assignedGuideId, setAssignedGuideId] = useState(initialEvent?.assignedGuideId || '');
  const [guideHours, setGuideHours] = useState(initialEvent?.guideHours || 0);
  const [assignedDriverId, setAssignedDriverId] = useState(initialEvent?.assignedDriverId || '');
  const [financialType, setFinancialType] = useState<FinancialExpenseType>(
    initialEvent?.financialType || 'NONE'
  );
  const [costNumber, setCostNumber] = useState<number>(
    initialEvent?.cost ? initialEvent.cost.toAmountNumber() : 0
  );
  const [status, setStatus] = useState<EventStatusType>(initialEvent?.status || 'PROGRAMADO');
  const [notes, setNotes] = useState(initialEvent?.notes || '');
  const [requiresGpsCheckIn, setRequiresGpsCheckIn] = useState(
    initialEvent?.requiresGpsCheckIn || false
  );
  const [requiresReceipt, setRequiresReceipt] = useState(initialEvent?.requiresReceipt || false);
  const [requiresSignature, setRequiresSignature] = useState(
    initialEvent?.requiresSignature || false
  );

  // Invariant: Live Territory Validation
  const territoryValidation = useMemo<{
    territory: OperativeTerritory | null;
    error: string | null;
  }>(() => {
    if (!locationAddress.trim()) {
      return { territory: null, error: 'La dirección no puede estar vacía' };
    }
    try {
      const territory = OperativeTerritory.fromString(locationAddress);
      return { territory, error: null };
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Ubicación no autorizada o fuera del corredor operativo';
      return { territory: null, error: msg };
    }
  }, [locationAddress]);

  // Live Settlement Impact Delta Calculation
  const settlementDelta = useMemo(() => {
    let guideFee = Money.zero();
    if (assignedGuideId && guideHours > 0) {
      guideFee = GUIDE_RATES.hourlyRate.multiply(guideHours);
    }

    let driverFee = Money.zero();
    if (assignedDriverId) {
      driverFee = FLEET_RATES.intraComunaShort; // default standard urban transfer
    }

    let directCost = Money.zero();
    if (costNumber > 0) {
      directCost = Money.fromAmount(costNumber, 'COP');
    }

    const totalDelta = guideFee.add(driverFee).add(directCost);

    return {
      guideFee,
      driverFee,
      directCost,
      totalDelta,
    };
  }, [assignedGuideId, guideHours, assignedDriverId, costNumber]);

  // Handle Preset selection
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    if (!presetId) return;

    if (CLINICAL_PROVIDERS[presetId]) {
      const p = CLINICAL_PROVIDERS[presetId];
      setLocationAddress(`${p.name} ${p.sector}`);
      setProviderId(p.id);
      setProviderName(p.name);
      if (p.category === 'CLINIC') setCategory('CLINICAL');
      else if (p.category === 'LAB') setCategory('LAB');
    } else if (ACCOMMODATION_PROVIDERS[presetId]) {
      const h = ACCOMMODATION_PROVIDERS[presetId];
      setLocationAddress(`${h.name} ${h.sector}`);
      setProviderId(h.id);
      setProviderName(h.name);
      setCategory('HOTEL');
    } else if (presetId === 'JMC_AIRPORT') {
      setLocationAddress('Aeropuerto JMC Rionegro');
      setCategory('FLIGHT');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!territoryValidation.territory || !title.trim()) {
      return;
    }

    const startIso = new Date(`${date}T${startTime}:00.000Z`).toISOString();
    const endIso = new Date(`${date}T${endTime}:00.000Z`).toISOString();

    const cost = costNumber > 0 ? Money.fromAmount(costNumber, 'COP') : Money.zero();

    await onSave({
      id: initialEvent?.id,
      bookingId,
      dayNumber: Number(dayNumber) || 1,
      title: title.trim(),
      category,
      startDateTime: startIso,
      endDateTime: endIso,
      location: territoryValidation.territory,
      providerId: providerId || undefined,
      providerName: providerName || undefined,
      assignedDriverId: assignedDriverId || undefined,
      assignedGuideId: assignedGuideId || undefined,
      financialType,
      cost,
      guideHours: guideHours > 0 ? Number(guideHours) : undefined,
      status,
      requiresGpsCheckIn,
      requiresReceipt,
      requiresSignature,
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 select-none" data-testid="event-form">
      {/* 1. Basic Info: Title & Category */}
      <div className="space-y-3">
        <Input
          label="Título del Evento"
          placeholder="Ej: Consulta Oftalmología Dr. Peláez"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          data-testid="event-input-title"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Categoría Operativa"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategoryType)}
            data-testid="event-select-category"
            options={[
              { value: 'CLINICAL', label: '🏥 Cita Clínica / Quirúrgica' },
              { value: 'LAB', label: '🔬 Laboratorio / Diagnóstico' },
              { value: 'FLIGHT', label: '✈️ Vuelo / Llegada Internacional' },
              { value: 'HOTEL', label: '🏨 Hotel / Recuperación' },
              { value: 'PHARMACY', label: '💊 Farmacia / Caja Menor' },
              { value: 'TRANSFER', label: '🚗 Traslado Ejecutivo Flota' },
            ]}
          />

          <Select
            label="Estado del Evento"
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatusType)}
            data-testid="event-select-status"
            options={[
              { value: 'PROGRAMADO', label: '⏳ Programado' },
              { value: 'EN_CAMINO', label: '🚗 En Camino' },
              { value: 'EN_SITIO', label: '📍 En Sitio' },
              { value: 'COMPLETADO', label: '✅ Completado' },
              { value: 'CANCELADO', label: '❌ Cancelado' },
            ]}
          />
        </div>
      </div>

      {/* 2. Schedule: Date & Times */}
      <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span>Programación & Horarios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            label="Día #"
            type="number"
            min="1"
            max="30"
            value={dayNumber}
            onChange={(e) => setDayNumber(parseInt(e.target.value, 10) || 1)}
            required
            data-testid="event-input-day"
          />
          <Input
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            data-testid="event-input-date"
          />
          <Input
            label="Hora Inicio"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            data-testid="event-input-start-time"
          />
          <Input
            label="Hora Fin"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            data-testid="event-input-end-time"
          />
        </div>
      </div>

      {/* 3. Location & Operative Territory (Fail-Fast Verification) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-700">
            Ubicación & Corredor Operativo
          </label>
          <span className="text-[11px] text-zinc-500 font-medium">Verificación de cobertura</span>
        </div>

        {/* Preset Selector */}
        <Select
          label="Preajuste Rápido de Proveedor / Hotel"
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          data-testid="event-select-preset"
          options={[
            { value: '', label: '-- Seleccionar prestador verificado --' },
            { value: 'CLINIC-HPTU', label: '🏥 Hospital Pablo Tobón Uribe (HPTU - Robledo)' },
            { value: 'CLINIC-CARDIO-VID', label: '❤️ Clínica Cardio VID (Robledo)' },
            { value: 'CLINIC-CLOFAN', label: '👁️ Clínica Clofán (Ciudad del Río)' },
            { value: 'CLINIC-CIMA', label: '🔬 CIMA Diagnóstica (Cra 44)' },
            { value: 'CLINIC-CES-OVIEDO', label: '🏥 Clínica CES Sede Oviedo (El Poblado)' },
            { value: 'CLINIC-CES-PRADO', label: '🏥 Clínica CES Sede Prado Centro' },
            { value: 'LAB-ECHAVARRIA', label: '🩸 Laboratorio Echavarría Domicilio' },
            { value: 'LAB-OCAZIONEZ', label: '🩻 Centro Radiológico Ocazionez' },
            { value: 'CLINIC-BOLIVARIANA', label: '🏥 Clínica Bolivariana (Laureles)' },
            { value: 'HOTEL-INNTU', label: '🏨 Hotel Inntu Laureles' },
            { value: 'HOTEL-PARK42', label: '🏢 Airbnb Ed. Park 42 Poblado' },
            { value: 'HOTEL-NOVELTY', label: '🏨 Hotel Novelty Suites Poblado' },
            { value: 'HOTEL-VILLA-ANITA', label: '🏡 Villa Anita Recovery (Envigado)' },
            { value: 'JMC_AIRPORT', label: '✈️ Aeropuerto JMC Rionegro' },
          ]}
        />

        {/* Manual Address Input */}
        <Input
          label="Dirección o Nombre de la Sede"
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
          placeholder="Ej: Torre Medica Ciudad del Rio Clofan"
          required
          data-testid="event-input-location"
        />

        {/* Territory Validation Badge */}
        {territoryValidation.error ? (
          <div
            data-testid="territory-error-badge"
            className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">⚠️ Territorio No Operativo (Fuera de Cobertura)</span>
              <p className="mt-0.5 leading-relaxed">{territoryValidation.error}</p>
            </div>
          </div>
        ) : (
          <div
            data-testid="territory-valid-badge"
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">Zona Autorizada:</span>
            <span className="font-mono font-medium">{territoryValidation.territory?.zone}</span>
          </div>
        )}
      </div>

      {/* 4. Personnel Assignment & Logistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Select
            label="Guía Bilingüe Asignado"
            value={assignedGuideId}
            onChange={(e) => setAssignedGuideId(e.target.value)}
            options={[
              { value: '', label: '-- Ninguno --' },
              ...Object.values(FIELD_STAFF)
                .filter((s: FieldStaffInfo) => s.role === 'GUIDE' || s.role === 'NURSE')
                .map((s: FieldStaffInfo) => ({
                  value: s.id,
                  label: `${s.name} (${s.languages.join(', ')})`,
                })),
            ]}
          />
          {assignedGuideId && (
            <Input
              label="Horas de Guianza"
              type="number"
              step="0.5"
              min="0"
              value={guideHours}
              onChange={(e) => setGuideHours(parseFloat(e.target.value) || 0)}
              helperText={`Tarifa estimada: $${(guideHours * 15500).toLocaleString('es-CO')} COP`}
            />
          )}
        </div>

        <div className="space-y-2">
          <Select
            label="Conductor / Vehículo Flota"
            value={assignedDriverId}
            onChange={(e) => setAssignedDriverId(e.target.value)}
            options={[
              { value: '', label: '-- Ninguno --' },
              ...Object.values(FLEET_DRIVERS).map((d: FleetDriverInfo) => ({
                value: d.id,
                label: `${d.name} · ${d.vehicleModel}`,
              })),
            ]}
          />
        </div>
      </div>

      {/* 5. Direct Cost & Financial Settlement Delta */}
      <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-zinc-200 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-900">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Impacto en la Liquidación Financiera</span>
          </div>
          <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold font-mono">
            Cálculo exacto al centavo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Gasto Directo / Copago COP"
            type="number"
            min="0"
            step="1000"
            value={costNumber}
            onChange={(e) => setCostNumber(parseInt(e.target.value, 10) || 0)}
            placeholder="0"
            data-testid="event-input-cost"
          />
          <Select
            label="Tipo de Imputación"
            value={financialType}
            onChange={(e) => setFinancialType(e.target.value as FinancialExpenseType)}
            options={[
              { value: 'NONE', label: 'Ninguno / Sin Impacto' },
              { value: 'OUT_OF_POCKET', label: 'Caja Menor / Gasto Bolsillo' },
              { value: 'GUIDE_FEE', label: 'Honorario de Guianza' },
              { value: 'FLEET_TAXI', label: 'Traslado de Flota' },
            ]}
          />
        </div>

        {/* Delta Summary Box */}
        <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-200/80">
          <span className="text-zinc-700 font-medium">Variación estimada en liquidación:</span>
          <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md tabular-nums">
            +{settlementDelta.totalDelta.formatCOP()}
          </span>
        </div>
      </div>

      {/* 6. Requirements Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-zinc-700">
        <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-100/70">
          <input
            type="checkbox"
            checked={requiresGpsCheckIn}
            onChange={(e) => setRequiresGpsCheckIn(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span>📍 Requiere GPS</span>
        </label>
        <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-100/70">
          <input
            type="checkbox"
            checked={requiresReceipt}
            onChange={(e) => setRequiresReceipt(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span>📷 Requiere Recibo</span>
        </label>
        <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-100/70">
          <input
            type="checkbox"
            checked={requiresSignature}
            onChange={(e) => setRequiresSignature(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span>✍️ Requiere Firma</span>
        </label>
      </div>

      {/* 7. Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-700">Notas & Observaciones</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Instrucciones especiales, requerimientos de ayuno o traducción..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950"
        />
      </div>

      {/* 8. Action Buttons */}
      <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2.5">
        <Button variant="outline" size="sm" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={!territoryValidation.territory || !title.trim() || isLoading}
          isLoading={isLoading}
          data-testid="event-form-submit"
          leftIcon={<Save className="w-4 h-4" />}
        >
          {initialEvent ? 'Guardar Cambios' : 'Crear Evento'}
        </Button>
      </div>
    </form>
  );
};
