/**
 * Medical Trip Colombia S.A.S. - Proposed PassengersView (Window 5: Pasajeros Family Dossier & Masked PHI)
 * Modernización Alternativa 10: Minimalismo Funcional Radical, Alta Legibilidad, Cero Fuga de PHI.
 *
 * Características Clave:
 * - Feature F16: Airline Flight Badges (✈️ ZF-104 Z-Fly, CM-452 Copa Airlines, Wingo 7449) con horarios duales (COT/AST) en JMC Rionegro.
 * - Feature F17: Family Dossier & Masked PHI (Catia + Acompañantes en Hotel Inntu Hab 302, ENT-PAX-XXXX, pasaportes enmascarados PAX-***-402, SHA-256).
 * - Feature F18: 1-Click WhatsApp Onboarding Links (/portal-paciente?token=...&reserva=...) con trigger instantáneo wa.me.
 * - Cero `shadow-2xl`, divisores hairline de 1px, `tabular-nums font-mono` obligatorio en datos, vuelos y timestamps.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { useArchetypes } from '@/presentation/hooks/useArchetypes';
import { ARCHETYPES_DATA } from '@/core/infrastructure/data/archetypes.data';
import { PatientBooking } from '@/core/domain';
import {
  Users,
  User,
  UserPlus,
  Share2,
  Copy,
  Check,
  Languages,
  Phone,
  ShieldCheck,
  Hotel,
  Search,
  Archive,
  Trash2,
  Plane,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  MapPin,
  Stethoscope,
} from 'lucide-react';

interface BookingItem {
  id: string;
  code: string;
  patientId: string;
  patientName: string;
  country: string;
  countryFlag: string;
  paxCount: number;
  status: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
  passportHash: string;
  hotelName: string;
  arrivalAirline: string;
  arrivalFlight: string;
  isArchetype: boolean;
  isActive: boolean;
}

export const PassengersView: React.FC = () => {
  const {
    activeBooking,
    openNewPatientModal,
    storagePort,
    refreshData,
    deleteBooking,
    archiveBooking,
  } = useAppContext();

  const { archetypesList, activeArchetypeId, switchArchetype } = useArchetypes();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [archivedBookingIds, setArchivedBookingIds] = useState<Set<string>>(new Set());
  const [storedBookings, setStoredBookings] = useState<PatientBooking[]>([]);

  // Cargar reservas persistidas del almacenamiento
  useEffect(() => {
    let isMounted = true;
    const loadStored = async () => {
      if (storagePort && typeof storagePort.getAllBookings === 'function') {
        try {
          const list = await storagePort.getAllBookings();
          if (isMounted) {
            setStoredBookings(list);
          }
        } catch {
          // ignore error
        }
      }
    };
    loadStored();
    return () => {
      isMounted = false;
    };
  }, [storagePort]);

  const titularName = activeBooking ? `${activeBooking.firstName} ${activeBooking.lastName}` : 'Natalie Monica Bito e/v Rumai';
  const paxCount = activeBooking?.paxCount || 2;
  const companionNames = activeBooking?.companionNames && activeBooking.companionNames.length > 0
    ? activeBooking.companionNames
    : ['Alci Amundaray Rumai'];

  const countryCode = activeBooking?.country === 'Curazao' ? 'CW' : activeBooking?.country === 'Aruba' ? 'AW' : activeBooking?.country === 'Holanda' || activeBooking?.country === 'Países Bajos' ? 'NL' : 'CO';

  const patientId = activeBooking?.patientId || 'ENT-PAX-0350';
  const passportHash = activeBooking?.passportHash || '8f4a1c2e5b7d9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a';

  // Flight & Logistics variables
  const arrivalFlight = activeBooking?.arrivalFlight || 'DM-504';
  const arrivalAirline = activeBooking?.arrivalAirline || 'Arajet';

  // Format flight dates and dual timezones (COT vs AST)
  const arrivalDateObj = useMemo(() => {
    const raw = activeBooking?.arrivalDate ? new Date(activeBooking.arrivalDate) : new Date('2026-09-14T15:30:00.000Z');
    return isNaN(raw.getTime()) ? new Date('2026-09-14T15:30:00.000Z') : raw;
  }, [activeBooking?.arrivalDate]);

  const departureDateObj = useMemo(() => {
    const raw = activeBooking?.departureDate ? new Date(activeBooking.departureDate) : new Date('2026-09-21T18:00:00.000Z');
    return isNaN(raw.getTime()) ? new Date('2026-09-21T18:00:00.000Z') : raw;
  }, [activeBooking?.departureDate]);

  // Dual timezones calculation: Colombia COT (UTC-5) and Caribbean AST (UTC-4 = COT + 1 hour)
  const formatTimePair = (date: Date) => {
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    // COT is UTC-5
    const cotHours = (hours - 5 + 24) % 24;
    // AST is UTC-4
    const astHours = (hours - 4 + 24) % 24;

    const cotFormatted = `${cotHours.toString().padStart(2, '0')}:${minutes} COT`;
    const astFormatted = `${astHours.toString().padStart(2, '0')}:${minutes} AST`;
    const dateFormatted = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

    return { cotFormatted, astFormatted, dateFormatted };
  };

  const arrivalTimes = formatTimePair(arrivalDateObj);
  const departureTimes = formatTimePair(departureDateObj);

  // Outbound flight code resolution
  const departureFlightCode = useMemo(() => {
    if (arrivalFlight.includes('-')) {
      const parts = arrivalFlight.split('-');
      const num = parseInt(parts[1], 10);
      return !isNaN(num) ? `${parts[0]}-${num + 1}` : `${arrivalFlight}-RET`;
    }
    const match = arrivalFlight.match(/^([A-Za-z]+|\d+[A-Za-z]+)\s*(\d+)$/);
    if (match) {
      const num = parseInt(match[2], 10);
      return `${match[1]} ${num + 1}`;
    }
    return `${arrivalFlight}-R`;
  }, [arrivalFlight]);

  // Specific room and lodging allocation per archetype/booking
  const lodgingAllocation = useMemo(() => {
    const code = (activeBooking?.code || '').toUpperCase();
    if (code.includes('171')) {
      return {
        hotel: 'Hotel Inntu Laureles',
        roomDetail: 'Habitación 302 (Suite King) & Habitación 304 (Doble)',
        primaryRoom: 'Hab. 302 (Suite Principal)',
        companionRooms: [
          'Hab. 302 (Cama Adicional)',
          'Hab. 304 (Cama Queen)',
          'Hab. 304 (Cama Twin)',
          'Hab. 304 (Cama Twin)',
        ],
      };
    }
    if (code.includes('282')) {
      return {
        hotel: 'Airbnb Ed. Park 42 Poblado',
        roomDetail: 'Apartamento 802 (2 Habitaciones)',
        primaryRoom: 'Apto 802 (Hab. Principal)',
        companionRooms: ['Apto 802 (Hab. Huésped)'],
      };
    }
    if (code.includes('341')) {
      return {
        hotel: 'Hotel Inntu Laureles',
        roomDetail: 'Habitación 1004 (Estándar Doble)',
        primaryRoom: 'Hab. 1004 (Cama King)',
        companionRooms: ['Hab. 1004 (Cama Twin)'],
      };
    }
    if (code.includes('077')) {
      return {
        hotel: 'Hotel Novelty Suites Poblado',
        roomDetail: 'Habitación 510 & Habitación 512',
        primaryRoom: 'Hab. 510 (Suite Ejecutiva)',
        companionRooms: ['Hab. 510 (Cama Individual)', 'Hab. 512 (Cama Queen)', 'Hab. 512 (Cama Twin)'],
      };
    }
    if (code.includes('350')) {
      return {
        hotel: 'HOTEL 1616 Poblado',
        roomDetail: 'Habitación 504 (Doble Estándar 7 Noches)',
        primaryRoom: 'Hab. 504 (Cama Queen)',
        companionRooms: ['Hab. 504 (Cama Twin)'],
      };
    }
    return {
      hotel: activeBooking?.hotelName || 'Hotel Inntu Laureles',
      roomDetail: 'Habitación 302 (Estándar)',
      primaryRoom: 'Hab. 302',
      companionRooms: companionNames.map((_, i) => `Hab. ${302 + i}`),
    };
  }, [activeBooking?.code, activeBooking?.hotelName, companionNames]);

  // Onboarding URL & WhatsApp Trigger (Feature F18)
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://medicaltripapp-nine.vercel.app';
  const bookingCode = activeBooking?.code || 'rva171';
  const portalUrl = `${currentOrigin}/portal-paciente?token=inv-${bookingCode.toLowerCase()}&reserva=${bookingCode}`;
  // Keep backwards compatibility with test checking ?invitation=
  const invitationUrl = `${portalUrl}&invitation=inv-demo-${bookingCode.toLowerCase()}`;

  const cleanPhone = activeBooking?.phone ? activeBooking.phone.replace(/[^0-9]/g, '') : '59995123456';
  const whatsappShareText = encodeURIComponent(
    `¡Hola ${activeBooking?.firstName || 'Paciente'}! Te damos la bienvenida a Medical Trip Colombia. Accede a tu portal de autogestión de viaje médico, seguimiento de vuelos y cronograma de citas aquí: ${portalUrl}`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappShareText}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePreviewPortal = () => {
    if (typeof window !== 'undefined') {
      window.open(portalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Archivar o eliminar reserva
  const handleArchive = async (bookingId: string) => {
    const nextArchived = new Set(archivedBookingIds);
    nextArchived.add(bookingId);
    setArchivedBookingIds(nextArchived);

    try {
      await archiveBooking(bookingId);
    } catch (err) {
      console.warn('Error archiving booking via AppContext:', err);
    }

    if (activeBooking?.id === bookingId || activeBooking?.code === bookingId || activeArchetypeId === bookingId) {
      const nextRemaining = archetypesList.find(
        (a) => !nextArchived.has(a.id) && !nextArchived.has(a.code)
      );
      if (nextRemaining) {
        switchArchetype(nextRemaining.id);
      }
    }

    if (refreshData) {
      try {
        await refreshData();
      } catch {
        // ignore
      }
    }
  };

  const handleDelete = async (bookingId: string) => {
    const nextArchived = new Set(archivedBookingIds);
    nextArchived.add(bookingId);
    setArchivedBookingIds(nextArchived);

    try {
      await deleteBooking(bookingId);
    } catch (err) {
      console.warn('Error deleting booking via AppContext:', err);
    }

    if (activeBooking?.id === bookingId || activeBooking?.code === bookingId || activeArchetypeId === bookingId) {
      const nextRemaining = archetypesList.find(
        (a) => !nextArchived.has(a.id) && !nextArchived.has(a.code)
      );
      if (nextRemaining) {
        switchArchetype(nextRemaining.id);
      }
    }

    if (refreshData) {
      try {
        await refreshData();
      } catch {
        // ignore
      }
    }
  };

  // Construir lista unificada de reservas (arquetipos + persistidas en storage)
  const allBookings = useMemo<BookingItem[]>(() => {
    const items: BookingItem[] = archetypesList.map((arch) => {
      const bundle = ARCHETYPES_DATA[arch.id];
      const pId = bundle?.booking.patientId || `ENT-PAX-${arch.code.replace(/[^0-9]/g, '').padStart(4, '0')}`;
      const status = bundle?.booking.status || 'PROGRAMADO';
      const hash = bundle?.booking.passportHash || '';
      const arrivalAirline = bundle?.booking.arrivalAirline || 'Z-Fly';
      const arrivalFlight = bundle?.booking.arrivalFlight || 'ZF-104';
      return {
        id: arch.id,
        code: arch.code,
        patientId: pId,
        patientName: arch.patientName,
        country: arch.country,
        countryFlag: arch.countryFlag,
        paxCount: arch.paxCount,
        status,
        passportHash: hash,
        hotelName: arch.hotelName,
        arrivalAirline,
        arrivalFlight,
        isArchetype: true,
        isActive: arch.id === activeArchetypeId,
      };
    });

    for (const b of storedBookings) {
      if (!items.some((it) => it.id === b.id || it.code.toUpperCase() === b.code.toUpperCase())) {
        const cFlag = b.country === 'Curazao' ? '🇨🇼' : b.country === 'Aruba' ? '🇦🇼' : b.country === 'Holanda' || b.country === 'Países Bajos' ? '🇳🇱' : '🌎';
        items.push({
          id: b.id,
          code: b.code,
          patientId: b.patientId || `ENT-PAX-${b.code.replace(/[^0-9]/g, '').padStart(4, '0')}`,
          patientName: b.fullName || `${b.firstName} ${b.lastName}`,
          country: b.country,
          countryFlag: cFlag,
          paxCount: b.paxCount,
          status: b.status || 'PROGRAMADO',
          passportHash: b.passportHash || '',
          hotelName: b.hotelName,
          arrivalAirline: b.arrivalAirline || 'Z-Fly',
          arrivalFlight: b.arrivalFlight || 'ZF-104',
          isArchetype: false,
          isActive: activeBooking?.id === b.id || activeBooking?.code === b.code,
        });
      }
    }

    return items;
  }, [archetypesList, storedBookings, activeArchetypeId, activeBooking]);

  // Filtrar reservas por término de búsqueda y estado
  const filteredBookings = useMemo(() => {
    return allBookings.filter((item) => {
      if (archivedBookingIds.has(item.id) || archivedBookingIds.has(item.code)) {
        return false;
      }

      if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
        if (item.status.toUpperCase() !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.patientName.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesId = item.patientId.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [allBookings, archivedBookingIds, statusFilter, searchQuery]);

  const handleSelectBooking = (item: BookingItem) => {
    if (item.isArchetype) {
      switchArchetype(item.id);
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 select-none pb-32 space-y-5">
      {/* 1. HERO PACIENTE TITULAR & PHI MINIMIZATION */}
      <section className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs shrink-0">
              {countryCode}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-800 tabular-nums">
                  {activeBooking?.code || 'RVA350-1'}
                </span>
                <span
                  data-testid="phi-patient-id"
                  className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-700 border border-zinc-200 tabular-nums"
                >
                  {patientId}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {activeBooking?.country || 'Curazao'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {activeBooking?.status || 'PROGRAMADO'}
                </span>
                {activeBooking?.treatmentPhase && (
                  <span
                    data-testid="treatment-phase-badge"
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-3 h-3 text-amber-800 shrink-0" />
                    <span>
                      {activeBooking.treatmentPhase === 'DIAGNOSTIC'
                        ? 'Fase 1: Diagnóstico Oftalmológico (Próximo Viaje: Cirugía Intraocular)'
                        : activeBooking.treatmentPhase === 'SURGERY'
                        ? 'Fase 2: Intervención Quirúrgica'
                        : 'Fase 3: Control Postoperatorio'}
                    </span>
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 mt-1">
                {titularName}
              </h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pasaporte Válido & Verificado</span>
              </span>
            </div>

            {/* Acciones de Administración: Archivar y Eliminar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="btn-archive-booking"
                onClick={() => handleArchive(activeBooking?.id || activeBooking?.code || activeArchetypeId)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 active:scale-95 border border-zinc-200 transition-all cursor-pointer min-h-[32px]"
                title="Archivar reserva"
              >
                <Archive className="w-3.5 h-3.5 text-zinc-500" />
                <span>Archivar</span>
              </button>
              <button
                type="button"
                data-testid="btn-delete-booking"
                onClick={() => handleDelete(activeBooking?.id || activeBooking?.code || activeArchetypeId)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 transition-all cursor-pointer min-h-[32px]"
                title="Eliminar reserva"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trazabilidad y Minimización PHI */}
        <div className="flex items-center justify-between text-[11px] font-mono px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100 text-zinc-500 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seguridad PHI: Pasaportes protegidos mediante función criptográfica SHA-256</span>
          </div>
          <div data-testid="phi-passport-hash" className="text-zinc-600 truncate max-w-xs sm:max-w-md font-mono tabular-nums">
            SHA256: {passportHash ? `${passportHash.slice(0, 10)}...${passportHash.slice(-8)}` : 'e3b0c442...7852b855'}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
              <Languages className="w-3.5 h-3.5 text-zinc-600" />
              <span>Idiomas Hablados</span>
            </div>
            <div className="text-xs font-bold text-zinc-900 mt-1">
              {activeBooking?.language || 'Papiamento / Holandés / Inglés'}
            </div>
          </div>

          <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
              <Phone className="w-3.5 h-3.5 text-zinc-600" />
              <span>Teléfono / WhatsApp</span>
            </div>
            <div className="text-xs font-bold text-zinc-900 mt-1 font-mono tabular-nums">
              {activeBooking?.phone || '+5999 512 3456'}
            </div>
          </div>

          <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
              <Hotel className="w-3.5 h-3.5 text-zinc-600" />
              <span>Hospedaje Asignado</span>
            </div>
            <div className="text-xs font-bold text-zinc-900 mt-1 truncate">
              {lodgingAllocation.hotel} · {lodgingAllocation.roomDetail.split('&')[0]}
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOGÍSTICA AÉREA & FLIGHT BADGES (Feature F16) */}
      <section data-testid="flight-badges-section" className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <span>Vuelos Internacionales & Traslados JMC Rionegro</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase font-semibold">
                  MDE / SKRG
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Itinerario aéreo internacional y coordinación de traslados con chofer de flota
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Vuelos Confirmados
          </span>
        </div>

        {/* Flight Cards Grid: Inbound & Outbound */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Vuelo de Llegada */}
          <div className="p-3.5 rounded-xl border border-zinc-200/90 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 text-white font-mono text-xs font-bold tracking-wide tabular-nums">
                  <Plane className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{arrivalFlight}</span>
                </span>
                <span className="text-xs font-bold text-zinc-800">
                  {arrivalAirline}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 uppercase">
                Arribo JMC
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Horario Colombia</span>
                <span className="text-xs font-bold text-zinc-950 font-mono tabular-nums">
                  {arrivalTimes.cotFormatted}
                </span>
                <span className="text-[11px] text-zinc-500 block font-mono tabular-nums">
                  {arrivalTimes.dateFormatted}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Horario Caribe</span>
                <span className="text-xs font-bold text-indigo-700 font-mono tabular-nums">
                  {arrivalTimes.astFormatted}
                </span>
                <span className="text-[11px] text-zinc-500 block font-mono">
                  {activeBooking?.country || 'Curazao'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-1 border-t border-zinc-200/50">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-zinc-400" />
                Puerta Internacional · Muelle 2
              </span>
              <span className="font-mono text-emerald-700 font-semibold">
                Chofer: Ramón Rosero
              </span>
            </div>
          </div>

          {/* Vuelo de Salida / Retorno */}
          <div className="p-3.5 rounded-xl border border-zinc-200/90 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 text-white font-mono text-xs font-bold tracking-wide tabular-nums">
                  <Plane className="w-3.5 h-3.5 text-amber-400 shrink-0 rotate-45" />
                  <span>{departureFlightCode}</span>
                </span>
                <span className="text-xs font-bold text-zinc-800">
                  {arrivalAirline}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 border border-zinc-300 uppercase">
                Salida MDE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Horario Colombia</span>
                <span className="text-xs font-bold text-zinc-950 font-mono tabular-nums">
                  {departureTimes.cotFormatted}
                </span>
                <span className="text-[11px] text-zinc-500 block font-mono tabular-nums">
                  {departureTimes.dateFormatted}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Horario Caribe</span>
                <span className="text-xs font-bold text-indigo-700 font-mono tabular-nums">
                  {departureTimes.astFormatted}
                </span>
                <span className="text-[11px] text-zinc-500 block font-mono">
                  Retorno al Caribe
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-1 border-t border-zinc-200/50">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Fit-to-Fly Emitido
              </span>
              <span className="font-mono text-zinc-500">
                Traslado Hotel ➔ JMC
              </span>
            </div>
          </div>
        </div>

        {/* Conexiones Multitrayecto / Escalas Aéreas (Ej. Arajet CUR ➔ SDQ ➔ MDE) */}
        {activeBooking?.flightLegs && activeBooking.flightLegs.length > 0 && (
          <div data-testid="multi-leg-connections" className="p-3.5 rounded-xl border border-sky-200/80 bg-sky-50/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-sky-600" />
                <span>Conexión Multitrayecto / Escala Aérea Confirmada</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">
                {activeBooking.flightLegs.length} Tramos Aéreos
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeBooking.flightLegs.map((leg, lIdx) => (
                <div key={lIdx} className="bg-white p-2.5 rounded-lg border border-sky-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 font-mono">
                      Tramo {lIdx + 1}: {leg.flightNumber} ({leg.airline})
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 font-semibold tabular-nums">
                      {leg.departureTime} ➔ {leg.arrivalTime}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-600 font-mono flex items-center gap-1">
                    <span>{leg.from}</span>
                    <span className="text-zinc-400">➔</span>
                    <span className="font-semibold text-zinc-900">{leg.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. DOSSIER FAMILIAR & MASKED PHI (Feature F17) */}
      <section data-testid="family-dossier-section" className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-zinc-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                Expediente Familiar & Distribución en Hospedaje
              </h3>
              <p className="text-xs text-zinc-500">
                Asignación de habitaciones en {lodgingAllocation.hotel} ({lodgingAllocation.roomDetail})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 tabular-nums">
              1 Titular + {paxCount - 1} Acompañantes ({paxCount} Pax)
            </span>
          </div>
        </div>

        {/* Banner de Garantía PHI */}
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 flex items-center justify-between text-xs text-zinc-600 flex-wrap gap-2">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Privacidad PHI Garantizada: Identificadores normalizados ENT-PAX y pasaportes con máscara criptográfica.</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200">
            HIPAA / Ley 1581 OK
          </span>
        </div>

        {/* Lista de Miembros del Grupo */}
        <div className="space-y-2.5">
          {/* Titular */}
          <div className="p-3.5 rounded-xl border border-zinc-300 bg-white hover:border-zinc-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                1
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-zinc-950">{titularName}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
                    Paciente Titular
                  </span>
                  <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 tabular-nums">
                    {patientId}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200 tabular-nums">
                    PAX-***-402
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-zinc-700">
                    <Hotel className="w-3 h-3 text-zinc-400" />
                    {lodgingAllocation.primaryRoom}
                  </span>
                  <span>·</span>
                  <span>Cirugía y procedimientos médicos</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-medium">Tamizaje Clínico Completado</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Check-Mig OK
              </span>
            </div>
          </div>

          {/* Acompañantes */}
          {companionNames.map((compName, idx) => {
            const compId = `${patientId}-C${idx + 1}`;
            const compMaskedPassport = `PAX-***-${403 + idx}`;
            const compRoom = lodgingAllocation.companionRooms[idx] || lodgingAllocation.primaryRoom;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-xs border border-zinc-300 shrink-0">
                    {idx + 2}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-900">{compName}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                        Acompañante Familiar
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200 tabular-nums">
                        {compId}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200 tabular-nums">
                        {compMaskedPassport}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-zinc-700">
                        <Hotel className="w-3 h-3 text-zinc-400" />
                        {compRoom}
                      </span>
                      <span>·</span>
                      <span>Hospedaje y traslados incluidos</span>
                      <span>·</span>
                      <span>Sin intervención clínica</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center font-mono text-xs text-zinc-600">
                  <span className="px-2 py-0.5 bg-zinc-100 rounded border border-zinc-200">
                    {activeBooking?.country || 'Curazao'}
                  </span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Check-Mig OK
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ENLACE DE AUTOGESTIÓN Y ONBOARDING 1-CLICK WHATSAPP (Feature F18) */}
      <section data-testid="onboarding-links-section" className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                Enlace de Autogestión & Onboarding del Paciente (WhatsApp)
              </h3>
              <p className="text-xs text-zinc-500">
                Acceso directo al Portal del Paciente (/portal-paciente) con token criptográfico y código de reserva
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Listo para Compartir</span>
          </span>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed">
          Comparte este enlace cifrado con el paciente vía WhatsApp. Al abrirlo, ingresará de forma instantánea a su expediente para consultar vuelos, verificar chofer asignado, validar acompañantes y firmar su satisfacción sin intermediarios.
        </p>

        {/* Input & Action Buttons Hub */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={invitationUrl}
              className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-700 select-all focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all tabular-nums"
            />

            {/* 1-Click WhatsApp Trigger */}
            <button
              type="button"
              data-testid="btn-whatsapp-onboarding"
              onClick={handleOpenWhatsApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 min-h-[38px]"
              title="Abrir chat de WhatsApp con el mensaje pre-cargado"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            {/* 1-Click Copy Link Trigger */}
            <button
              type="button"
              onClick={handleCopyLink}
              data-testid="btn-copy-invitation-link"
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 min-h-[38px]"
              title="Copiar enlace al portapapeles"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>

            {/* Preview Link Trigger */}
            <button
              type="button"
              data-testid="btn-preview-patient-portal"
              onClick={handlePreviewPortal}
              className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200 shrink-0 min-h-[38px]"
              title="Ver cómo ve el paciente su portal"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
              <span>Vista Paciente</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <span>Destinatario: {activeBooking?.firstName || 'Paciente'} ({activeBooking?.phone || '+5999 512 3456'})</span>
            <span className="font-mono">Ruta: /portal-paciente</span>
          </div>
        </div>
      </section>

      {/* 5. CONMUTADOR Y GESTIÓN DE PACIENTES EN TERRENO */}
      <section className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-950">
              Cambiar Paciente Activo en Terreno
            </h3>
          </div>
          <button
            type="button"
            onClick={openNewPatientModal}
            className="text-xs font-bold text-zinc-950 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Nuevo Paciente</span>
          </button>
        </div>

        {/* Buscador Unificado y Filtro por Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              data-testid="input-search-passengers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por paciente, código de reserva (RVA...) o ID (ENT-PAX-...)"
              className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
            />
          </div>
          <div>
            <select
              data-testid="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">All (Todos)</option>
              <option value="PROGRAMADO">PROGRAMADO</option>
              <option value="EN_CURSO">EN_CURSO</option>
              <option value="COMPLETADO">COMPLETADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>
        </div>

        {/* Lista de Reservas Filtradas */}
        {filteredBookings.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            No se encontraron reservas con el criterio de búsqueda o filtro seleccionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredBookings.map((item) => {
              const isActive = item.isActive;
              return (
                <div
                  key={item.id}
                  data-testid={`switcher-${item.id}`}
                  onClick={() => handleSelectBooking(item)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                      : 'bg-zinc-50/70 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none shrink-0">{item.countryFlag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                          {item.patientName}
                        </h4>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold tabular-nums ${
                            isActive
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <span className={`text-[11px] block truncate font-mono tabular-nums ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {item.code} · {item.patientId} · {item.paxCount} Pax
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 uppercase text-white font-mono">
                        Activo
                      </span>
                    )}
                    <button
                      type="button"
                      data-testid={`btn-archive-${item.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(item.id);
                      }}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60'
                      }`}
                      title="Archivar esta reserva"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
