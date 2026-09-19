/**
 * Medical Trip Colombia S.A.S. - PatientPortalView
 * Vista principal y contenedor del Portal del Paciente Internacional:
 * - Aislamiento 100% estricto de herramientas administrativas y contables
 * - Navegación modular por pestañas: Itinerario, Vuelos/Traslados, Hospedaje, Acompañante
 * - Botón de Certificación de Conformidad & Satisfacción
 * - Cumplimiento del Matriz de Ausencia DOM de 22 ítems
 */

import React, { useState } from 'react';
import { useAuth } from '@/core/auth';
import { useAppContext } from '@/presentation/state/AppContext';
import { PatientPortalHeader } from './PatientPortalHeader';
import { PatientItinerarySection } from './PatientItinerarySection';
import { PatientFlightSection } from './PatientFlightSection';
import { PatientHotelSection } from './PatientHotelSection';
import { PatientCompanionSection } from './PatientCompanionSection';
import { PatientSatisfactionModal } from './PatientSatisfactionModal';
import { Calendar, Plane, Building2, UserCheck, Award, Sparkles } from 'lucide-react';

export type PatientPortalTab = 'itinerary' | 'flights' | 'hotel' | 'companion';

export const PatientPortalView: React.FC = () => {
  const { user } = useAuth();
  const { activeBooking } = useAppContext();
  const [activeTab, setActiveTab] = useState<PatientPortalTab>('itinerary');
  const [isSatisfactionOpen, setIsSatisfactionOpen] = useState<boolean>(false);

  const patientName = user?.name || activeBooking?.firstName
    ? `${activeBooking?.firstName || ''} ${activeBooking?.lastName || ''}`.trim()
    : 'Catia Rodrigues';
  const bookingCode = user?.bookingCode || user?.bookingId || activeBooking?.code || 'RVA171-4';
  const patientId = user?.patientId || activeBooking?.patientId || 'ENT-PAX-0171';

  return (
    <div
      data-testid="patient-portal-root"
      id="portal-paciente"
      className="min-h-screen w-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 select-none overflow-x-hidden"
    >
      {/* 1. Header Institucional Limpio */}
      <PatientPortalHeader onOpenSatisfactionModal={() => setIsSatisfactionOpen(true)} />

      {/* 2. Navigation Bar de Pestañas del Paciente */}
      <nav
        data-testid="patient-portal-nav"
        className="px-4 sm:px-6 py-2.5 bg-white border-b border-zinc-200/80 flex items-center justify-between gap-3 overflow-x-auto shadow-2xs"
        aria-label="Navegación del portal de paciente"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('itinerary')}
            data-testid="tab-patient-itinerary"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
              activeTab === 'itinerary'
                ? 'bg-zinc-950 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Itinerario Clínico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flights')}
            data-testid="tab-patient-flights"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
              activeTab === 'flights'
                ? 'bg-zinc-950 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Vuelo & Traslados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hotel')}
            data-testid="tab-patient-hotel"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
              activeTab === 'hotel'
                ? 'bg-zinc-950 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospedaje</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('companion')}
            data-testid="tab-patient-companion"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
              activeTab === 'companion'
                ? 'bg-zinc-950 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Acompañante</span>
          </button>
        </div>

        {/* 1-Tap Satisfaction Signature CTA */}
        <button
          type="button"
          onClick={() => setIsSatisfactionOpen(true)}
          data-testid="btn-open-satisfaction-modal"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 min-h-[38px]"
        >
          <Award className="w-3.5 h-3.5 text-emerald-200" />
          <span className="hidden sm:inline">Firmar Conformidad de Servicio ✍️</span>
          <span className="sm:hidden">Firmar ✍️</span>
        </button>
      </nav>

      {/* 3. Contenedor Principal */}
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Welcome Banner Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Bienvenido a su Portal Personal, {patientName}</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Aquí puede consultar de forma segura su itinerario médico, vuelo, hotel y acompañamiento en Medellín.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200/70 self-start sm:self-auto">
            <span>Reserva:</span>
            <strong className="text-zinc-950 font-bold tabular-nums">{bookingCode}</strong>
          </div>
        </div>

        {/* Dynamic Section Rendering based on Active Tab */}
        {activeTab === 'itinerary' && <PatientItinerarySection />}
        {activeTab === 'flights' && <PatientFlightSection />}
        {activeTab === 'hotel' && <PatientHotelSection />}
        {activeTab === 'companion' && <PatientCompanionSection />}
      </main>

      {/* 4. Footer Minimalista */}
      <footer className="px-6 py-4 border-t border-zinc-200/80 bg-white text-center text-xs text-zinc-400 font-mono mt-auto select-none">
        Medical Trip Colombia S.A.S. • Portal del Paciente Internacional • Operación Certificada
      </footer>

      {/* 5. Satisfaction & Signature Modal */}
      <PatientSatisfactionModal
        isOpen={isSatisfactionOpen}
        onClose={() => setIsSatisfactionOpen(false)}
        patientName={patientName}
        bookingCode={bookingCode}
        patientId={patientId}
      />
    </div>
  );
};
