/**
 * Medical Trip Colombia S.A.S. - PatientOrientationModal
 * Kit de Bienvenida y Orientación para Pacientes Internacionales.
 * 100% libre de costos de liquidación interna o tarifas administrativas.
 */

import React, { useState } from 'react';
import {
  PhoneCall,
  Wifi,
  DollarSign,
  Clock,
  ShieldCheck,
  Building2,
  Car,
  UserCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  X,
} from 'lucide-react';

export interface PatientOrientationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverName?: string;
  driverPhone?: string;
  guideName?: string;
  guidePhone?: string;
  hotelName?: string;
  hotelPhone?: string;
}

export const PatientOrientationModal: React.FC<PatientOrientationModalProps> = ({
  isOpen,
  onClose,
  driverName = 'Ramón Rosero',
  driverPhone = '+57 310 456 7890',
  guideName = 'Yenny Roberto',
  guidePhone = '+57 300 123 4567',
  hotelName = 'Hotel Inntu Laureles',
  hotelPhone = '+57 604 448 0042',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div
      data-testid="patient-orientation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white border border-zinc-200/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/80 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-1.5">
              <span>Kit de Bienvenida y Orientación</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full font-mono">
                Caribe ➔ Medellín
              </span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Contactos 24/7, SIM Card, cambio de divisas e indicaciones clínicas para su estadía
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-patient-orientation-modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer"
            aria-label="Cerrar modal de orientación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-zinc-900">
          {/* 1. Directorio de Emergencia 24/7 */}
          <section className="bg-zinc-50/50 rounded-xl border border-zinc-200/70 p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                  Directorio de Asistencia 24/7
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono font-bold">
                Línea Activa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Concierge Hotline */}
              <div className="p-2.5 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-medium text-zinc-500">Coordinación Médica MT</p>
                    <p className="text-xs font-bold text-zinc-950 font-mono tabular-nums">+57 300 123 4567</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('+573001234567', 'concierge')}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                  title="Copiar teléfono"
                >
                  {copiedKey === 'concierge' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Assigned Guide */}
              <div className="p-2.5 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-medium text-zinc-500">Acompañante: {guideName}</p>
                    <p className="text-xs font-bold text-zinc-950 font-mono tabular-nums">{guidePhone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(guidePhone, 'guide')}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                  title="Copiar teléfono"
                >
                  {copiedKey === 'guide' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Assigned Driver */}
              <div className="p-2.5 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-medium text-zinc-500">Conductor: {driverName}</p>
                    <p className="text-xs font-bold text-zinc-950 font-mono tabular-nums">{driverPhone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(driverPhone, 'driver')}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                  title="Copiar teléfono"
                >
                  {copiedKey === 'driver' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Assigned Hotel */}
              <div className="p-2.5 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-medium text-zinc-500">Recepción: {hotelName}</p>
                    <p className="text-xs font-bold text-zinc-950 font-mono tabular-nums">{hotelPhone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(hotelPhone, 'hotel')}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                  title="Copiar teléfono"
                >
                  {copiedKey === 'hotel' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* National Emergency 123 */}
            <div className="mt-2.5 flex items-center justify-between px-3 py-2 rounded-lg bg-rose-50 border border-rose-200/60 text-xs text-rose-950">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Línea Nacional de Emergencias Médicas & Policía Nacional</span>
              </div>
              <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Tel: 123
              </span>
            </div>
          </section>

          {/* 2. SIM Card Claro */}
          <section className="bg-zinc-50/50 rounded-xl border border-zinc-200/70 p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                  Conectividad Local (SIM Card Claro)
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entregada en Aeropuerto JMC
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-white rounded-lg border border-zinc-200/70">
                <p className="text-[11px] font-medium text-zinc-500">Plan de Datos Incluido</p>
                <p className="font-bold text-zinc-900 mt-0.5">80 GB Navegación + WhatsApp Ilimitado</p>
                <p className="text-[11px] text-zinc-500 mt-1">Cobertura 4G / 5G nacional en Medellín y Antioquia.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-zinc-200/70">
                <p className="text-[11px] font-medium text-zinc-500">Número Móvil Colombiano Asignado</p>
                <p className="font-mono font-bold text-indigo-950 mt-0.5 tabular-nums text-sm">+57 304 598 1234</p>
                <p className="text-[11px] text-zinc-500 mt-1">Comparta este número con sus familiares para contacto local.</p>
              </div>
            </div>
          </section>

          {/* 3. Guía de Cambio de Divisas */}
          <section className="bg-zinc-50/50 rounded-xl border border-zinc-200/70 p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-200/50">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                Orientación de Divisas (Moneda Local: COP)
              </h3>
            </div>

            {/* Referencia de Tasas */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-center">
                <span className="text-[10px] font-bold text-emerald-800 font-mono">1 USD ➔ COP</span>
                <p className="text-sm font-bold text-emerald-950 font-mono mt-0.5 tabular-nums">~$4.050</p>
              </div>
              <div className="p-2.5 bg-sky-50/60 border border-sky-200 rounded-lg text-center">
                <span className="text-[10px] font-bold text-sky-800 font-mono">1 ANG/AWG ➔ COP</span>
                <p className="text-sm font-bold text-sky-950 font-mono mt-0.5 tabular-nums">~$2.250</p>
              </div>
              <div className="p-2.5 bg-purple-50/60 border border-purple-200 rounded-lg text-center">
                <span className="text-[10px] font-bold text-purple-800 font-mono">1 EUR ➔ COP</span>
                <p className="text-sm font-bold text-purple-950 font-mono mt-0.5 tabular-nums">~$4.400</p>
              </div>
            </div>

            {/* Casas de Cambio Recomendadas */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-white border border-zinc-200/70 rounded-lg flex items-start gap-2">
                <Building2 className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-zinc-900">Casas de Cambio Autorizadas:</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    • <strong>Centro Comercial Oviedo</strong> (Cra 43A #6 Sur-15, Poblado) · Western Union / Cambios G&D<br />
                    • <strong>Milla de Oro Poblado</strong> (Cra 42 #3 Sur-81) · Cambios Medellín<br />
                    • <strong>El Tesoro Parque Comercial</strong> (Cra 25A #1A Sur-45)
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start gap-2 text-amber-950">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Recomendamos retirar pesos colombianos directamente en cajeros automáticos (ATM) de Bancolombia, Davivienda o Servibanca ubicados dentro de centros comerciales o clínicas. Evite cambiar dinero en la calle.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Indicaciones Clínicas de Ayuno */}
          <section className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs text-indigo-950">
              <p className="font-bold">Recordatorio Clínico Importante:</p>
              <p className="text-[11px] text-indigo-900 mt-0.5">
                Para exámenes de laboratorio en ayunas, no consuma alimentos ni bebidas (excepto agua pura) durante las 8 horas previas a su cita matutina. Su acompañante estará presente para coordinar el traslado.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-200/80 bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Medical Trip Colombia S.A.S. • Protocolo de Llegada
          </span>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-patient-orientation-bottom"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
