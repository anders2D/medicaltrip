/**
 * Medical Trip Colombia S.A.S. - PlanView (Window 4: Plan Dual Clinical Timeline & Hospital Triage)
 * Modernización Alternativa 10: Eje Clínico vs Eje Logístico en paralelo, Triage Hospitalario 24/7 y
 * contactos directos de emergencia con minimización de carga cognitiva.
 *
 * Características:
 * - Feature F14: Dual Clinical Timeline (Track 1: Eje Clínico & Quirúrgico vs Track 2: Eje Logístico & Recuperación)
 *   con badge de ayuno estricto (05:30 AM), filtro interactivo y diseño responsive.
 * - Feature F15: Hospital Triage Emergency Contacts (Línea 24/7 Carolina Cortázar, Dra. Jenny Paola Acosta,
 *   y Red Acreditada CIMA, Clínica Medellín, CES, HPTU con tel: dialers y WhatsApp prellenado).
 * - Preservación 100% retrocompatible de cadenas para tests existentes (Paquete Oftalmológico,
 *   Chequeo Cardiológico Integral Cardio VID, Clínica Cardio VID, Hotel Novelty Suites Poblado).
 */

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import {
  Calendar,
  Hotel,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  AlertTriangle,
  Activity,
  Pill,
  Car,
  Plane,
  MessageCircle,
  HeartPulse,
} from 'lucide-react';
import {
  MASTER_TRIAGE_FACILITIES,
  EMERGENCY_COORDINATORS,
} from '../domain/PlanContracts';

export const PlanView: React.FC = () => {
  const { activeBooking, events } = useAppContext();
  const [trackFilter, setTrackFilter] = useState<'ALL' | 'CLINICAL' | 'LOGISTICS'>('ALL');

  const isRva350 = activeBooking?.code?.toUpperCase().includes('350') || activeBooking?.notes?.includes('Glaucornea');

  const packageName = isRva350
    ? 'Paquete Oftalmológico & Diagnóstico Glaucornea (17 Días / Fase 1)'
    : activeBooking?.notes?.includes('Oftalmología')
    ? 'Paquete Oftalmológico & Diagnóstico CIMA (5 Días)'
    : activeBooking?.notes?.includes('Cardio')
    ? 'Chequeo Cardiológico Integral Cardio VID (5 Días)'
    : activeBooking?.notes?.includes('Cirugía')
    ? 'Cirugía Plástica Reconstructiva & Estética (12 Días)'
    : 'Atención Médica Especializada Internacional (5 Días)';

  const clinicName = isRva350
    ? 'Glaucornea · Oftalmología Integral (Dr. Lukas Saldarriaga)'
    : activeBooking?.notes?.includes('Clofán')
    ? 'Clínica Clofán · Oftalmología Avanzada'
    : activeBooking?.notes?.includes('Cardio')
    ? 'Clínica Cardio VID'
    : 'Clínica CIMA · Cirugía & Especialistas';

  const clinicAddress = isRva350
    ? 'Carrera 48 #19A-40, Torre Médica Ciudad del Río, Cons. 1518-1519, Medellín'
    : activeBooking?.notes?.includes('Clofán')
    ? 'Carrera 48 #19A-40, Ciudad del Río, Medellín'
    : activeBooking?.notes?.includes('Cardio')
    ? 'Calle 78B #75-86, Robledo, Medellín'
    : 'Calle 7 Sur #42-70, El Poblado, Medellín';

  const doctorName = isRva350 ? 'Dr. Lukas Saldarriaga' : 'Dr. Marcos Yepes';

  const hotelName = activeBooking?.hotelName || 'Hotel Inntu Laureles';
  const hotelAddress = hotelName.includes('1616')
    ? 'Carrera 43A #16A Sur-38, El Poblado, Medellín'
    : hotelName.includes('Inntu')
    ? 'Circular 73 #3-12, Laureles, Medellín'
    : hotelName.includes('Park 42')
    ? 'Calle 7 Sur #42-40, El Poblado, Medellín'
    : 'Calle 10A #36-22, El Poblado, Medellín';

  const servicesIncluded = [
    { title: 'Flota Privada Aeroturex', desc: 'Traslados aeropuerto JMC ↔ Hotel ↔ Clínicas en vehículos climatizados' },
    { title: 'Acompañamiento Bilingüe Presencial', desc: 'Guianza en cada consulta médica (Papiamento / Neerlandés / Inglés)' },
    { title: 'Seguro Médico Internacional', desc: 'Póliza de asistencia al viajero con cobertura en caso de complicaciones' },
    { title: 'Gestión Migratoria Check-Mig', desc: 'Radicación electrónica ante Migración Colombia 48h antes del vuelo' },
    { title: 'Certificado Digital Fit-to-Fly', desc: 'Valoración médica final para autorización de abordaje y regreso seguro' },
    { title: 'Kit de Bienvenida & Conectividad', desc: 'SIM Card local prepago con datos ilimitados y orientación en Medellín' },
  ];

  // Helper to format UTC time string e.g. 05:30 AM
  const formatUtcTime = (iso: string, notes?: string, title?: string) => {
    // If explicit 05:30 AM is mentioned in notes or title for fasting lab
    if ((notes && notes.includes('05:30')) || (title && title.includes('05:30'))) {
      return '05:30 AM';
    }
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '09:00 AM';
      const h = d.getUTCHours();
      const m = d.getUTCMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
    } catch {
      return '09:00 AM';
    }
  };

  // Group events by day and categorize into Clinical vs Logistics tracks
  const daysGrouped = useMemo(() => {
    if (!events || events.length === 0) return [];

    const map = new Map<number, { dayNumber: number; clinicalEvents: typeof events; logisticsEvents: typeof events }>();

    events.forEach((evt) => {
      const day = evt.dayNumber || 1;
      if (!map.has(day)) {
        map.set(day, { dayNumber: day, clinicalEvents: [], logisticsEvents: [] });
      }
      const entry = map.get(day)!;
      if (evt.category === 'CLINICAL' || evt.category === 'LAB') {
        entry.clinicalEvents.push(evt);
      } else {
        entry.logisticsEvents.push(evt);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [events]);

  // Pre-formatted WhatsApp emergency message
  const patientFullName = activeBooking ? `${activeBooking.firstName} ${activeBooking.lastName}` : 'Paciente';
  const bookingCode = activeBooking?.code || 'RVA171';
  const waEmergencyMessage = encodeURIComponent(
    `URGENCIA 24/7: Paciente ${patientFullName} (${bookingCode}) requiere valoración inmediata de triage.`
  );

  const getWaLink = (phoneDigits: string) => `https://wa.me/${phoneDigits}?text=${waEmergencyMessage}`;

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 select-none pb-32 space-y-5">
      {/* 1. HERO PACKAGE BANNER */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-700 tabular-nums">
                {activeBooking?.code || 'RVA171-4'}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                Paciente: {activeBooking ? `${activeBooking.firstName} ${activeBooking.lastName}` : 'Catia Rodrigues'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 mt-1">
              {packageName}
            </h2>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Plan Confirmado & Activo</span>
          </span>
        </div>

        {/* Stay Dates and Flight Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
              <span>Llegada a Colombia</span>
            </div>
            <div className="text-sm font-bold text-zinc-900 mt-1 font-mono tabular-nums">
              20 de Agosto 2026
            </div>
            <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
              Vuelo {activeBooking?.arrivalFlight || 'ZF-104'} ({activeBooking?.arrivalAirline || 'Z-Fly'})
            </span>
          </div>

          <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
              <span>Salida de Regreso</span>
            </div>
            <div className="text-sm font-bold text-zinc-900 mt-1 font-mono tabular-nums">
              25 de Agosto 2026
            </div>
            <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
              Vuelo Retorno MDE (Fit-to-Fly)
            </span>
          </div>

          <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-zinc-600" />
              <span>Duración del Plan</span>
            </div>
            <div className="text-sm font-bold text-zinc-900 mt-1">
              5 Días / 4 Noches
            </div>
            <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
              Grupo de {activeBooking?.paxCount || 5} Pax
            </span>
          </div>
        </div>
      </div>

      {/* 2. HOSPITAL TRIAGE & EMERGENCY CONTACTS SECTION (Feature F15) */}
      <section
        data-testid="hospital-triage-section"
        className="bg-white border border-rose-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-100 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <span>Red Hospitalaria de Urgencias & Triage Internacional 24/7</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 uppercase font-bold">
                  S.O.S. Clínico
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Línea directa de respuesta médica inmediata y centros hospitalarios acreditados
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 shrink-0 self-start sm:self-auto">
            Disponibilidad 24 Horas
          </span>
        </div>

        {/* Coordinadores de Urgencia 24/7 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tarjeta 1: Línea 24/7 Carolina Cortázar */}
          <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-950">
                  {EMERGENCY_COORDINATORS.HOTLINE_24_7.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                  Operaciones 24/7
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {EMERGENCY_COORDINATORS.HOTLINE_24_7.roleTitle}
              </p>
              <span className="text-[11px] text-zinc-500 block font-mono mt-1">
                {EMERGENCY_COORDINATORS.HOTLINE_24_7.location}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-rose-100">
              <a
                href={EMERGENCY_COORDINATORS.HOTLINE_24_7.phoneDialer}
                data-testid="emergency-hotline-call"
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs font-mono tabular-nums"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Llamar 24/7</span>
              </a>
              <a
                href={getWaLink(EMERGENCY_COORDINATORS.HOTLINE_24_7.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="emergency-hotline-wa"
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                <span>WhatsApp S.O.S.</span>
              </a>
            </div>
          </div>

          {/* Tarjeta 2: Dirección Médica Dra. Jenny Paola Acosta */}
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-950">
                  {EMERGENCY_COORDINATORS.MEDICAL_DIRECTOR.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Directora Médica
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {EMERGENCY_COORDINATORS.MEDICAL_DIRECTOR.roleTitle}
              </p>
              <span className="text-[11px] text-zinc-500 block font-mono mt-1">
                {EMERGENCY_COORDINATORS.MEDICAL_DIRECTOR.location}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60">
              <a
                href={EMERGENCY_COORDINATORS.MEDICAL_DIRECTOR.phoneDialer}
                data-testid="dra-acosta-call"
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs font-mono tabular-nums"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Llamar Dra. Acosta</span>
              </a>
              <a
                href={getWaLink(EMERGENCY_COORDINATORS.MEDICAL_DIRECTOR.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="dra-acosta-wa"
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                <span>WhatsApp Triage</span>
              </a>
            </div>
          </div>
        </div>

        {/* Red Acreditada de Hospitales Aliados */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-2 px-0.5">
            Centros Hospitalarios & Triage Acreditado en Medellín
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {MASTER_TRIAGE_FACILITIES.map((facility) => {
              const testIdSuffix = facility.id.toLowerCase().replace('facility-', '');
              return (
                <div
                  key={facility.id}
                  data-testid={`facility-${testIdSuffix}`}
                  className="p-3 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors flex flex-col justify-between space-y-2 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-950 truncate">
                        {facility.name.split('(')[0].trim()}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold shrink-0">
                        {facility.zone}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                      {facility.level}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {facility.address}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-zinc-100 flex items-center gap-1.5">
                    <a
                      href={facility.phoneDialer}
                      title={`Llamar a ${facility.name}`}
                      className="flex-1 py-1 px-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono font-semibold flex items-center justify-center gap-1 transition-all tabular-nums border border-zinc-200/80"
                    >
                      <Phone className="w-3 h-3 text-zinc-600" />
                      <span>{facility.phoneDisplay.split(')')[1] || facility.phoneDisplay}</span>
                    </a>
                    <a
                      href={getWaLink(facility.whatsappNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`WhatsApp Triage ${facility.name}`}
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. DUAL CLINICAL TIMELINE (Feature F14) */}
      <section
        data-testid="dual-clinical-timeline"
        className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-zinc-800" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                Cronograma Dual Día a Día: Eje Clínico & Eje Logístico
              </h3>
              <p className="text-xs text-zinc-500">
                Sincronización paralela de valoraciones médicas con transporte y descanso en hotel
              </p>
            </div>
          </div>

          {/* Filtro de Vistas Interactivas */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-xl border border-zinc-200 self-start sm:self-auto text-xs font-semibold">
            <button
              type="button"
              data-testid="filter-track-dual"
              onClick={() => setTrackFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                trackFilter === 'ALL'
                  ? 'bg-white text-zinc-950 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Vista Dual Paralela
            </button>
            <button
              type="button"
              data-testid="filter-track-clinical"
              onClick={() => setTrackFilter('CLINICAL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                trackFilter === 'CLINICAL'
                  ? 'bg-white text-zinc-950 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Solo Eje Clínico
            </button>
            <button
              type="button"
              data-testid="filter-track-logistics"
              onClick={() => setTrackFilter('LOGISTICS')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                trackFilter === 'LOGISTICS'
                  ? 'bg-white text-zinc-950 shadow-2xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Solo Eje Logístico
            </button>
          </div>
        </div>

        {/* Render de Días en Swimlanes Duales */}
        {daysGrouped.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            No se han registrado eventos en el cronograma para esta reserva.
          </div>
        ) : (
          <div className="space-y-4">
            {daysGrouped.map((day) => {
              const showClinical = trackFilter === 'ALL' || trackFilter === 'CLINICAL';
              const showLogistics = trackFilter === 'ALL' || trackFilter === 'LOGISTICS';

              return (
                <div
                  key={day.dayNumber}
                  data-testid={`timeline-day-${day.dayNumber}`}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 space-y-3"
                >
                  {/* Header de Día */}
                  <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                        {day.dayNumber}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                        Día {day.dayNumber} de Estancia
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                      {day.clinicalEvents.length} Clínico(s) · {day.logisticsEvents.length} Logístico(s)
                    </span>
                  </div>

                  {/* Swimlanes Grid */}
                  <div
                    className={`grid gap-3 ${
                      trackFilter === 'ALL' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    {/* SWIMLANE 1: EJE CLÍNICO & QUIRÚRGICO */}
                    {showClinical && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 px-1">
                          <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Eje Clínico & Quirúrgico</span>
                        </div>

                        {day.clinicalEvents.length === 0 ? (
                          <div className="p-3 bg-white rounded-lg border border-dashed border-zinc-200 text-[11px] text-zinc-400 italic">
                            Día de reposo clínico o recuperación hotelera
                          </div>
                        ) : (
                          day.clinicalEvents.map((evt) => {
                            const isFasting =
                              evt.notes?.toLowerCase().includes('ayun') ||
                              evt.title?.toLowerCase().includes('ayun') ||
                              evt.notes?.includes('05:30') ||
                              evt.title?.includes('05:30');
                            const timeStr = formatUtcTime(evt.startDateTime, evt.notes, evt.title);

                            return (
                              <div
                                key={evt.id}
                                className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-1.5 hover:border-indigo-200 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80 tabular-nums">
                                      {timeStr}
                                    </span>
                                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase border ${
                                      evt.status === 'COMPLETADO'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : evt.status === 'EN_SITIO' || evt.status === 'EN_CAMINO'
                                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                    }`}>
                                      {evt.status}
                                    </span>
                                  </div>
                                  {isFasting && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                      <AlertTriangle className="w-3 h-3 text-amber-700" />
                                      <span>05:30 AM · Ayuno Estricto</span>
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h5 className="text-xs font-bold text-zinc-950 leading-snug">
                                    {evt.title}
                                  </h5>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                                    <span className="flex items-center gap-1 font-medium text-zinc-700">
                                      <MapPin className="w-3 h-3 text-zinc-400" />
                                      {evt.location?.address || 'Sede Médica'}
                                    </span>
                                  </div>
                                </div>

                                {evt.notes && (
                                  <p className="text-[11px] text-zinc-600 bg-zinc-50 p-1.5 rounded-md border border-zinc-100 leading-relaxed font-mono">
                                    {evt.notes}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* SWIMLANE 2: EJE LOGÍSTICO & RECUPERACIÓN */}
                    {showLogistics && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 px-1">
                          <Car className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Eje Logístico & Terreno</span>
                        </div>

                        {day.logisticsEvents.length === 0 ? (
                          <div className="p-3 bg-white rounded-lg border border-dashed border-zinc-200 text-[11px] text-zinc-400 italic">
                            Sin traslados adicionales programados
                          </div>
                        ) : (
                          day.logisticsEvents.map((evt) => {
                            const timeStr = formatUtcTime(evt.startDateTime, evt.notes, evt.title);
                            const isFlight = evt.category === 'FLIGHT';
                            const isPharmacy = evt.category === 'PHARMACY';

                            return (
                              <div
                                key={evt.id}
                                className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5 hover:border-emerald-200 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 tabular-nums">
                                      {timeStr}
                                    </span>
                                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                                      {evt.category}
                                    </span>
                                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase border ${
                                      evt.status === 'COMPLETADO'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : evt.status === 'EN_SITIO' || evt.status === 'EN_CAMINO'
                                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                    }`}>
                                      {evt.status}
                                    </span>
                                  </div>
                                  {evt.title?.toLowerCase().includes('comuna 13') && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                      Tour Cultural Comuna 13
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h5 className="text-xs font-bold text-zinc-950 leading-snug">
                                    {evt.title}
                                  </h5>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                                    <span className="flex items-center gap-1 font-medium text-zinc-700">
                                      {isFlight ? (
                                        <Plane className="w-3 h-3 text-sky-500" />
                                      ) : isPharmacy ? (
                                        <Pill className="w-3 h-3 text-rose-500" />
                                      ) : (
                                        <Car className="w-3 h-3 text-emerald-500" />
                                      )}
                                      {evt.location?.address || 'Operación en Terreno'}
                                    </span>
                                  </div>
                                </div>

                                {evt.notes && (
                                  <p className="text-[11px] text-zinc-600 bg-zinc-50 p-1.5 rounded-md border border-zinc-100 leading-relaxed font-mono">
                                    {evt.notes}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. CLINICAL NETWORK & HOSPITAL PROVIDER */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-zinc-900">
              Red Clínica & Especialistas Asignados
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Territorio Validado: Medellín</span>
        </div>

        <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-zinc-950">
              {clinicName}
            </h4>
            <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
              Sede de Alta Complejidad
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{clinicAddress}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
            <span>Médico: <strong className="text-zinc-800 font-semibold">{doctorName}</strong></span>
            <span>Contacto Enfermería: <strong className="text-zinc-800 font-semibold font-mono tabular-nums">+57 (4) 444 0000</strong></span>
          </div>
        </div>
      </div>

      {/* 5. HOTEL & RECOVERY ACCOMMODATION */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Hotel className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-zinc-900">
              Hospedaje & Recuperación
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Alojamiento Aliado</span>
        </div>

        <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-zinc-950">
              {hotelName}
            </h4>
            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Alojamiento Adaptado Postoperatorio
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{hotelAddress}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
            <span>Acomodación: <strong className="text-zinc-800 font-semibold">Suite Múltiple ({activeBooking?.paxCount || 5} Pax)</strong></span>
            <span>Régimen: <strong className="text-zinc-800 font-semibold">Desayuno incluido & Ascensor camillero</strong></span>
          </div>
        </div>
      </div>

      {/* 6. SERVICES INCLUDED IN PACKAGE */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-zinc-900">
              Servicios y Coberturas Incluidas en el Plan
            </h3>
          </div>
          <span className="text-xs text-emerald-700 font-semibold">Garantía Medical Trip</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {servicesIncluded.map((serv, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-zinc-900 leading-snug">
                  {serv.title}
                </h5>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                  {serv.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
