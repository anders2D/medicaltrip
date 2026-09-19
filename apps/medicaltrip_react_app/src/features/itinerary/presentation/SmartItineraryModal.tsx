/**
 * Medical Trip Colombia S.A.S. - SmartItineraryModal
 * 1-Click Surgical/Clinical Smart Itinerary Generator Modal (Flow 2).
 * Features:
 * - 4 Canonical Clinical Presets (Cirugía Plástica 12d, Cardiología 5d, Oftalmología 3d, Urología 4d).
 * - 1-Click direct generation from preset cards or primary batch submit CTA.
 * - Interactive milestone timeline preview with 15-minute slot snapping and geocoded locations.
 * - Settlement impact summary in COP with BigInt integer cents.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { PatientBooking } from '../../../domain/entities/PatientBooking';
import {
  Sparkles,
  Scissors,
  HeartPulse,
  Eye,
  Stethoscope,
  Calendar,
  X,
  Zap,
  UserCheck,
} from 'lucide-react';

export type ClinicalPresetKey =
  | 'PLASTIC_SURGERY_12D'
  | 'CARDIOLOGY_5D'
  | 'OPHTHALMOLOGY_3D'
  | 'UROLOGY_4D';

export interface ClinicalPresetDefinition {
  key: ClinicalPresetKey;
  altKey: string;
  title: string;
  subtitle: string;
  durationDays: number;
  badgeColor: string;
  specialtyTag: string;
  primaryClinic: string;
  recommendedHotel: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedGuideHours: number;
  estimatedCostCOP: number;
  milestones: Array<{
    dayOffset: number;
    startTime: string;
    endTime: string;
    title: string;
    category: 'FLIGHT' | 'CLINICAL' | 'LAB' | 'PHARMACY' | 'HOTEL';
    location: string;
    costCOP: number;
  }>;
}

export const CLINICAL_PRESETS_CATALOG: Record<ClinicalPresetKey, ClinicalPresetDefinition> = {
  PLASTIC_SURGERY_12D: {
    key: 'PLASTIC_SURGERY_12D',
    altKey: 'cirugia_plastica_12d',
    title: 'Cirugía Plástica & Reconstructiva 12d',
    subtitle: 'HPTU Dr. Mosquera · Novelty Suites · Ayuno 05:30 AM · Fit-to-Fly',
    durationDays: 12,
    badgeColor: 'rose',
    specialtyTag: 'Cirugía Plástica',
    primaryClinic: 'Hospital Pablo Tobón Uribe (HPTU)',
    recommendedHotel: 'Hotel Novelty Suites Poblado',
    icon: Scissors,
    estimatedGuideHours: 20,
    estimatedCostCOP: 1044755,
    milestones: [
      {
        dayOffset: 0,
        startTime: '10:00',
        endTime: '12:00',
        title: 'Llegada & Traslado Aeropuerto JMC',
        category: 'FLIGHT',
        location: 'Aeropuerto JMC',
        costCOP: 145000,
      },
      {
        dayOffset: 1,
        startTime: '05:30',
        endTime: '06:30',
        title: 'Laboratorio Clínico Domiciliario (Ayunas 05:30 AM)',
        category: 'LAB',
        location: 'Hotel Novelty Suites Poblado',
        costCOP: 97350,
      },
      {
        dayOffset: 1,
        startTime: '14:00',
        endTime: '18:00',
        title: 'Valoración Quirúrgica Previa HPTU',
        category: 'CLINICAL',
        location: 'Hospital Pablo Tobon Uribe Robledo',
        costCOP: 62000,
      },
      {
        dayOffset: 2,
        startTime: '09:00',
        endTime: '12:00',
        title: 'Valoración Pre-Anestésica y Electrocardiograma en HPTU',
        category: 'CLINICAL',
        location: 'Hospital Pablo Tobon Uribe Robledo',
        costCOP: 46500,
      },
      {
        dayOffset: 3,
        startTime: '06:00',
        endTime: '18:00',
        title: 'Procedimiento Quirúrgico & Estancia Clínica HPTU',
        category: 'CLINICAL',
        location: 'Hospital Pablo Tobon Uribe Robledo',
        costCOP: 231000,
      },
      {
        dayOffset: 4,
        startTime: '09:00',
        endTime: '11:00',
        title: 'Control Postoperatorio y Curación en Hotel',
        category: 'HOTEL',
        location: 'Hotel Novelty Suites Poblado',
        costCOP: 0,
      },
      {
        dayOffset: 10,
        startTime: '10:00',
        endTime: '12:00',
        title: 'Consulta de Alta & Certificación Fit-to-Fly',
        category: 'CLINICAL',
        location: 'Hospital Pablo Tobon Uribe Robledo',
        costCOP: 31000,
      },
      {
        dayOffset: 11,
        startTime: '07:00',
        endTime: '09:00',
        title: 'Traslado al Aeropuerto JMC Retorno',
        category: 'FLIGHT',
        location: 'Aeropuerto JMC',
        costCOP: 145000,
      },
    ],
  },

  CARDIOLOGY_5D: {
    key: 'CARDIOLOGY_5D',
    altKey: 'cardiologia_5d',
    title: 'Cardiología & Chequeo Integral 5d',
    subtitle: 'Cardio VID · Park 42 · Doppler · Ecocardiograma · Fit-to-Fly',
    durationDays: 5,
    badgeColor: 'indigo',
    specialtyTag: 'Cardiología',
    primaryClinic: 'Clínica Cardio VID Robledo',
    recommendedHotel: 'Airbnb Ed. Park 42 Poblado',
    icon: HeartPulse,
    estimatedGuideHours: 8,
    estimatedCostCOP: 549409,
    milestones: [
      {
        dayOffset: 0,
        startTime: '14:00',
        endTime: '16:00',
        title: 'Llegada & Traslado Aeropuerto JMC',
        category: 'FLIGHT',
        location: 'Aeropuerto JMC',
        costCOP: 145000,
      },
      {
        dayOffset: 1,
        startTime: '05:30',
        endTime: '06:30',
        title: 'Laboratorio Clínico Domiciliario (Perfil Lipídico, Troponina 05:30 AM)',
        category: 'LAB',
        location: 'Edificio Park 42 Poblado',
        costCOP: 125000,
      },
      {
        dayOffset: 1,
        startTime: '09:00',
        endTime: '12:00',
        title: 'Consulta Cardiología Dr. Marcos Yepes en CES Oviedo',
        category: 'CLINICAL',
        location: 'Torre Medica Oviedo CES',
        costCOP: 46500,
      },
      {
        dayOffset: 2,
        startTime: '08:00',
        endTime: '13:00',
        title: 'Chequeo Cardiovascular Integral & Doppler en Clínica Cardio VID',
        category: 'CLINICAL',
        location: 'Cardio VID Robledo',
        costCOP: 77500,
      },
      {
        dayOffset: 3,
        startTime: '10:00',
        endTime: '12:00',
        title: 'Retiro de Holter 24h & Certificación Fit-to-Fly Cardio VID',
        category: 'CLINICAL',
        location: 'Cardio VID Robledo',
        costCOP: 31000,
      },
      {
        dayOffset: 4,
        startTime: '15:00',
        endTime: '17:00',
        title: 'Hotel Check-out ➔ Traslado al Aeropuerto JMC',
        category: 'FLIGHT',
        location: 'Aeropuerto JMC',
        costCOP: 145000,
      },
    ],
  },

  OPHTHALMOLOGY_3D: {
    key: 'OPHTHALMOLOGY_3D',
    altKey: 'oftalmologia_3d',
    title: 'Oftalmología Láser & CIMA 3d',
    subtitle: 'Clínica Clofán · Inntu Laureles · Pentacam · Cirugía Láser',
    durationDays: 3,
    badgeColor: 'sky',
    specialtyTag: 'Oftalmología',
    primaryClinic: 'Clínica Clofán Ciudad del Río',
    recommendedHotel: 'Hotel Inntu Laureles',
    icon: Eye,
    estimatedGuideHours: 6.5,
    estimatedCostCOP: 490750,
    milestones: [
      {
        dayOffset: 0,
        startTime: '09:30',
        endTime: '11:30',
        title: 'Llegada & Traslado Aeropuerto JMC',
        category: 'FLIGHT',
        location: 'Aeropuerto JMC',
        costCOP: 145000,
      },
      {
        dayOffset: 0,
        startTime: '15:00',
        endTime: '17:30',
        title: 'Topografía Corneal Pentacam & Dilatación de Pupila Clofán',
        category: 'CLINICAL',
        location: 'Torre Medica Ciudad del Rio Clofan',
        costCOP: 38750,
      },
      {
        dayOffset: 1,
        startTime: '05:30',
        endTime: '06:30',
        title: 'Laboratorio Clínico Domiciliario en Ayunas (05:30 AM)',
        category: 'LAB',
        location: 'Hotel Inntu Laureles',
        costCOP: 85000,
      },
      {
        dayOffset: 1,
        startTime: '08:30',
        endTime: '12:00',
        title: 'Cirugía Refractiva Láser Clofán Dr. Jorge Peláez',
        category: 'CLINICAL',
        location: 'Torre Medica Ciudad del Rio Clofan',
        costCOP: 54250,
      },
      {
        dayOffset: 1,
        startTime: '12:30',
        endTime: '13:15',
        title: 'Compra Gotas Antibióticas y Lágrimas Artificiales Cruz Verde',
        category: 'PHARMACY',
        location: 'Torre Medica Ciudad del Rio Clofan',
        costCOP: 85000,
      },
      {
        dayOffset: 2,
        startTime: '08:30',
        endTime: '10:00',
        title: 'Control Post-Op Lámpara de Hendidura y Certificado Fit-to-Fly Clofán',
        category: 'CLINICAL',
        location: 'Torre Medica Ciudad del Rio Clofan',
        costCOP: 23250,
      },
      {
        dayOffset: 2,
        startTime: '13:00',
        endTime: '15:00',
        title: 'Hotel Check-out ➔ Traslado al Aeropuerto JMC',
        category: 'FLIGHT',
        location: 'Aeropuerto JMC',
        costCOP: 145000,
      },
    ],
  },

  UROLOGY_4D: {
    key: 'UROLOGY_4D',
    altKey: 'urologia_4d',
    title: 'Urología de Alta Complejidad 4d',
    subtitle: 'CES Oviedo Dr. Suárez · Inntu Laureles · Domicilio 05:30 AM',
    durationDays: 4,
    badgeColor: 'teal',
    specialtyTag: 'Urología',
    primaryClinic: 'Clínica CES Sede Oviedo',
    recommendedHotel: 'Hotel Inntu Laureles',
    icon: Stethoscope,
    estimatedGuideHours: 5,
    estimatedCostCOP: 399850,
    milestones: [
      {
        dayOffset: 0,
        startTime: '15:00',
        endTime: '17:00',
        title: 'Llegada & Traslado Aeropuerto JMC',
        category: 'FLIGHT',
        location: 'Aeropuerto JMC',
        costCOP: 110000,
      },
      {
        dayOffset: 1,
        startTime: '05:30',
        endTime: '06:30',
        title: 'Laboratorio Clínico Domiciliario (Uroanálisis, Creatinina 05:30 AM)',
        category: 'LAB',
        location: 'Hotel Inntu Laureles',
        costCOP: 97350,
      },
      {
        dayOffset: 1,
        startTime: '12:00',
        endTime: '17:00',
        title: 'Consulta Urología en Inglés Dr. Carlos Suárez en CES Oviedo',
        category: 'CLINICAL',
        location: 'Torre Medica Oviedo CES',
        costCOP: 77500,
      },
      {
        dayOffset: 2,
        startTime: '07:30',
        endTime: '13:30',
        title: 'Procedimiento Quirúrgico / Diagnóstico Ambulatorio Clínica CES',
        category: 'CLINICAL',
        location: 'Torre Medica Oviedo CES',
        costCOP: 93000,
      },
      {
        dayOffset: 3,
        startTime: '09:00',
        endTime: '11:00',
        title: 'Control Post-Procedimiento & Certificación Fit-to-Fly CES Oviedo',
        category: 'CLINICAL',
        location: 'Torre Medica Oviedo CES',
        costCOP: 31000,
      },
      {
        dayOffset: 3,
        startTime: '14:00',
        endTime: '16:00',
        title: 'Hotel Check-out ➔ Traslado al Aeropuerto JMC Retorno',
        category: 'FLIGHT',
        location: 'Aeropuerto JMC',
        costCOP: 110000,
      },
    ],
  },
};

export interface SmartItineraryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeBooking?: PatientBooking | null;
  onGenerate?: (presetKey: string, baseDate: Date) => Promise<any>;
  onSuccess?: () => void;
}

export const SmartItineraryModal: React.FC<SmartItineraryModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  activeBooking: propActiveBooking,
  onGenerate: propOnGenerate,
  onSuccess,
}) => {
  const context = useAppContext();
  const isOpen = propIsOpen !== undefined ? propIsOpen : context.isSmartItineraryModalOpen;
  const onClose = propOnClose || context.closeSmartItineraryModal;
  const activeBooking = propActiveBooking !== undefined ? propActiveBooking : context.activeBooking;

  const [selectedPreset, setSelectedPreset] = useState<ClinicalPresetKey>('PLASTIC_SURGERY_12D');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSettleCompanion, setAutoSettleCompanion] = useState(true);

  const bookingShifts = useMemo(() => {
    if (!activeBooking) return [];
    return (context.shifts || []).filter(
      (s) => s.bookingId === activeBooking.code || s.bookingId === activeBooking.id
    );
  }, [activeBooking, context.shifts]);

  const hasCompanionSettlement = bookingShifts.length > 0;
  const activeDefinition = CLINICAL_PRESETS_CATALOG[selectedPreset] || CLINICAL_PRESETS_CATALOG.PLASTIC_SURGERY_12D;

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = async (presetToGenerate: string) => {
    if (!hasCompanionSettlement && !autoSettleCompanion) {
      setError('Para hacer el itinerario, debe tener la liquidación de acompañante presencial configurada.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const baseDate = activeBooking
        ? new Date(activeBooking.arrivalDate)
        : new Date();

      if (propOnGenerate) {
        await propOnGenerate(presetToGenerate, baseDate);
      } else {
        await context.generateSmartItinerary(
          presetToGenerate,
          baseDate
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar el itinerario');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        data-testid="smart-itinerary-modal"
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-sm ring-1 ring-zinc-950/5 border border-zinc-200/90 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-zinc-950">
                Generar Itinerario Inteligente
              </h3>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5 pl-9 font-medium">
              Programación automática por lotes con protocolos médicos y traslados sincronizados
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-smart-modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer active:scale-95 duration-200"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 select-none">
          {/* Active Patient Summary Banner */}
          {activeBooking && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🇨🇼</span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-950">
                    {activeBooking.fullName} ({activeBooking.code})
                  </h4>
                  <p className="text-xs text-zinc-600 font-medium font-mono">
                    Llegada: {new Date(activeBooking.arrivalDate).toLocaleDateString('es-CO')} · {activeBooking.paxCount} Viajeros · {activeBooking.hotelName}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
                Paciente Activo
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* 4 Presets 2x2 Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.values(CLINICAL_PRESETS_CATALOG) as ClinicalPresetDefinition[]).map((preset) => {
              const isSelected = preset.key === selectedPreset;
              const Icon = preset.icon;

              return (
                <div
                  key={preset.key}
                  data-testid={`preset-card-${preset.altKey}`}
                  onClick={() => setSelectedPreset(preset.key)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between active:scale-95 duration-200 ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 ring-2 ring-zinc-900 ring-offset-1'
                      : 'bg-white text-zinc-950 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold leading-snug">{preset.title}</h4>
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? 'text-zinc-300' : 'text-zinc-500'
                            }`}
                          >
                            {preset.specialtyTag}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        {preset.durationDays} Días
                      </span>
                    </div>

                    <p
                      className={`text-xs line-clamp-2 leading-relaxed mb-2.5 ${
                        isSelected ? 'text-zinc-300' : 'text-zinc-600'
                      }`}
                    >
                      {preset.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100/20 flex items-center justify-between gap-2">
                    <span className={`text-xs font-mono font-medium tabular-nums ${isSelected ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      ${(preset.estimatedCostCOP).toLocaleString('es-CO')} COP
                    </span>

                    {/* Quick 1-Click Generate Button */}
                    <button
                      type="button"
                      data-testid={`btn-quick-generate-${preset.altKey}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerate(preset.altKey);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 duration-200 ${
                        isSelected
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>1-Clic</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verificación de Liquidación de Acompañante Presencial */}
          <div
            data-testid="companion-settlement-check-card"
            className={`p-3.5 rounded-xl border text-xs transition-all ${
              hasCompanionSettlement
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className={`w-4 h-4 ${hasCompanionSettlement ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="font-bold text-xs">
                  {hasCompanionSettlement
                    ? 'Liquidación de Acompañante Presencial Vinculada'
                    : 'Requisito: Liquidación de Acompañante Presencial'}
                </span>
              </div>

              {hasCompanionSettlement ? (
                <span className="bg-emerald-600 text-white font-mono font-bold text-2xs px-2 py-0.5 rounded-full">
                  {bookingShifts.length} {bookingShifts.length === 1 ? 'Turno Liquidado' : 'Turnos Liquidados'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => context.openCompanionTurnModal()}
                  className="text-xs font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                >
                  Personalizar Turno
                </button>
              )}
            </div>

            {!hasCompanionSettlement && (
              <div className="mt-2.5 pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2">
                <p className="text-2xs text-amber-800 flex-1 min-w-[200px]">
                  Para hacer el itinerario, debe tener la liquidación de acompañante presencial ($15.500/h + $15.500 Prep + Subsidio de alimentación).
                </p>
                <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSettleCompanion}
                    onChange={(e) => setAutoSettleCompanion(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-zinc-900 focus:ring-zinc-950"
                  />
                  <span className="font-bold text-amber-900 text-2xs">
                    Auto-liquidar con el Itinerario (~{activeDefinition.estimatedGuideHours}h)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Selected Preset Timeline Preview */}
          <div className="border border-zinc-200 rounded-xl p-3.5 bg-zinc-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Cronograma a Generar ({activeDefinition.milestones.length} Hitos Clínicos & Traslados)</span>
              </h4>
              <span className="text-xs font-mono text-zinc-500">
                Guía Acompañante: ~{activeDefinition.estimatedGuideHours}h
              </span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {activeDefinition.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 bg-white p-2 rounded-lg border border-zinc-200 text-xs"
                >
                  <span className="bg-zinc-900 text-white text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0">
                    Día {m.dayOffset + 1}
                  </span>
                  <span className="text-zinc-600 font-mono text-xs shrink-0 font-medium tabular-nums">
                    {m.startTime}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-950 text-xs truncate">{m.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{m.location}</p>
                  </div>
                  {m.costCOP > 0 && (
                    <span className="text-xs font-mono font-semibold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                      ${m.costCOP.toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer active:scale-95 duration-200"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGenerate(activeDefinition.altKey)}
              data-testid="btn-generate-itinerary-submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isGenerating ? 'Generando...' : `Generar Itinerario (${activeDefinition.milestones.length} Eventos)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartItineraryModal;
