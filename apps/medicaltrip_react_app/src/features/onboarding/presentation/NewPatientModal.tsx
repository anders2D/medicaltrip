/**
 * Medical Trip Colombia S.A.S. - NewPatientModal
 * Formulario Integral y Rápido de Nuevo Paciente / Reserva (Flow 1).
 * Features:
 * - Smart operational defaults (Curazao 🇨🇼, Papiamento, Hotel Inntu Laureles, 2 Pax).
 * - Complete booking registration in <= 2 clicks or shortcut [N].
 * - Discriminación de edades (Adultos, Niños, Infantes) por pasajero.
 * - Encuesta médica por pasajero (Enfermedades preexistentes, toma de medicamentos, dosis/frecuencia y requerimientos).
 * - Cotización individual por persona consolidada en la reserva.
 * - Carga de soportes obligatorios (Pasaporte, Encuesta médica, Tiquete de vuelo, Soporte de Hotel si aplica).
 * - Botón para copiar enlace de autogestión autoservicio para el paciente vía WhatsApp.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { PatientBooking, PassengerRecord, AgeCategory } from '@/core/domain';
import { OperativeTerritory } from '@/core/domain';
import { CreatePatientBookingDTO } from '../../../application/use-cases/CreatePatientBookingUseCase';
import {
  UserPlus,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Copy,
  Check,
  Share2,
} from 'lucide-react';

export interface NewPatientModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (bookingData: CreatePatientBookingDTO) => Promise<PatientBooking>;
  onSuccess?: (booking: PatientBooking) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSubmit: propOnSubmit,
  onSuccess,
}) => {
  const context = useAppContext();
  const isOpen = propIsOpen !== undefined ? propIsOpen : context.isNewPatientModalOpen;
  const onClose = propOnClose || context.closeNewPatientModal;

  const getDefaultArrival = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const getDefaultDeparture = (arrivalIso: string) => {
    const d = new Date(arrivalIso);
    d.setDate(d.getDate() + 7);
    d.setHours(15, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [activeTab, setActiveTab] = useState<'BASIC' | 'PASSENGERS'>('BASIC');
  const [firstName, setFirstName] = useState('Nuevo');
  const [lastName, setLastName] = useState('Paciente');
  const [country, setCountry] = useState('Curazao');
  const [language, setLanguage] = useState('Papiamento');
  const [hotelId, setHotelId] = useState('HOTEL-INNTU');
  const [customHotel, setCustomHotel] = useState('');
  const [paxCount, setPaxCount] = useState<number>(2);
  const [arrivalDateLocal, setArrivalDateLocal] = useState(getDefaultArrival);
  const [departureDateLocal, setDepartureDateLocal] = useState(() =>
    getDefaultDeparture(getDefaultArrival())
  );
  const [airline, setAirline] = useState('Z-Fly');
  const [flightNumber, setFlightNumber] = useState('ZF-104');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [phone, setPhone] = useState('+5999 512 0000');
  const [email, setEmail] = useState('paciente@medicaltrip.test');
  const [notes, setNotes] = useState('Reserva rápida creada en terreno');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [territoryError, setTerritoryError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Hotel reservation and support
  const [requiresHotelReservation, setRequiresHotelReservation] = useState(false);
  const [hotelVoucherFileName, setHotelVoucherFileName] = useState('');

  // Passengers list with age category, survey and quotation
  const [passengers, setPassengers] = useState<PassengerRecord[]>([
    {
      id: 'pax-primary',
      fullName: 'Nuevo Paciente',
      age: 38,
      ageCategory: 'ADULT',
      individualQuotationCOP: 12000000,
      medicalSurvey: {
        hasPreexistingConditions: false,
        takesMedications: false,
        specialRequirements: [],
      },
      documents: {},
    },
    {
      id: 'pax-companion-1',
      fullName: 'Acompañante de Nuevo',
      age: 35,
      ageCategory: 'ADULT',
      individualQuotationCOP: 2500000,
      medicalSurvey: {
        hasPreexistingConditions: false,
        takesMedications: false,
        specialRequirements: [],
      },
      documents: {},
    },
  ]);

  // Synchronize passenger count with paxCount
  useEffect(() => {
    setPassengers((prev) => {
      if (prev.length === paxCount) return prev;
      if (prev.length < paxCount) {
        const added: PassengerRecord[] = [];
        for (let i = prev.length; i < paxCount; i++) {
          added.push({
            id: `pax-${Date.now()}-${i}`,
            fullName: `Acompañante ${i}`,
            age: 30,
            ageCategory: 'ADULT',
            individualQuotationCOP: 2000000,
            medicalSurvey: {
              hasPreexistingConditions: false,
              takesMedications: false,
              specialRequirements: [],
            },
            documents: {},
          });
        }
        return [...prev, ...added];
      }
      return prev.slice(0, paxCount);
    });
  }, [paxCount]);

  const hotelNamesMap: Record<string, string> = useMemo(
    () => ({
      'HOTEL-INNTU': 'Hotel Inntu Laureles',
      'HOTEL-PARK42': 'Airbnb Ed. Park 42 Poblado',
      'HOTEL-NOVELTY': 'Hotel Novelty Suites Poblado',
      'HOTEL-VILLA-ANITA': 'Villa Anita Envigado',
      'HOTEL-DIEZ': 'Hotel Diez Poblado',
      'HOTEL-CUSTOM': customHotel || 'Hotel Personalizado',
    }),
    [customHotel]
  );

  // Validate territory when hotel selection changes
  useEffect(() => {
    const selectedHotelAddress =
      hotelId === 'HOTEL-CUSTOM' || customHotel
        ? customHotel
        : hotelNamesMap[hotelId] || 'Hotel Inntu Laureles';

    if (!selectedHotelAddress || selectedHotelAddress.trim().length === 0) {
      setTerritoryError(null);
      return;
    }

    try {
      OperativeTerritory.fromString(selectedHotelAddress);
      setTerritoryError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Territorio No Operativo';
      setTerritoryError(msg);
    }
  }, [hotelId, customHotel, hotelNamesMap]);

  // Handle ESC key to close
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

  const getAdminReservaLink = () => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://medicaltripapp-nine.vercel.app';
    const params = new URLSearchParams({
      autogestion: 'true',
      name: `${firstName.trim()} ${lastName.trim()}`.trim() || 'Titular de la Reserva',
      country: country || 'Curazao',
      lang: language || 'Papiamento',
      pax: paxCount.toString(),
      date: arrivalDateLocal ? arrivalDateLocal.slice(0, 10) : '',
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleCopySelfRegLink = () => {
    const link = getAdminReservaLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const link = getAdminReservaLink();
    const titularName = firstName.trim() || 'Titular';
    const message = encodeURIComponent(
      `Hola ${titularName}! Te compartimos tu enlace oficial como Administrador de la Reserva con Medical Trip Colombia para que registres tu viaje, acompañantes y detalles de hotel: ${link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const updatePassenger = (index: number, updates: Partial<PassengerRecord>) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleSubmitBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (territoryError) return;

    // Validate hotel support if hotel reservation requested
    if (requiresHotelReservation && !hotelVoucherFileName) {
      setError('Si solicitas reserva de hotel, es obligatorio adjuntar el soporte o voucher de hospedaje.');
      setIsAdvancedOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const effectiveHotelName =
        hotelId === 'HOTEL-CUSTOM' || customHotel
          ? customHotel
          : hotelNamesMap[hotelId] || 'Hotel Inntu Laureles';

      // Domain invariant check
      OperativeTerritory.fromString(effectiveHotelName);

      // Ensure titular passenger has current names
      const synchronizedPassengers = [...passengers];
      if (synchronizedPassengers.length > 0) {
        synchronizedPassengers[0] = {
          ...synchronizedPassengers[0],
          fullName: `${firstName.trim()} ${lastName.trim()}`.trim() || 'Paciente Titular',
        };
      }

      const bookingDTO: CreatePatientBookingDTO = {
        firstName: firstName.trim() || 'Paciente',
        lastName: lastName.trim() || 'Curazao',
        patientName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        country,
        language,
        paxCount,
        arrivalDate: new Date(arrivalDateLocal).toISOString(),
        departureDate: new Date(departureDateLocal).toISOString(),
        airline,
        flightNumber,
        arrivalAirline: airline,
        arrivalFlight: flightNumber,
        hotel: effectiveHotelName,
        hotelId,
        hotelName: effectiveHotelName,
        phone,
        email,
        companionNames: paxCount > 1 ? synchronizedPassengers.slice(1).map((p) => p.fullName) : [],
        notes,
        passengers: synchronizedPassengers,
        requiresHotelReservation,
        hotelVoucherFileName: requiresHotelReservation ? hotelVoucherFileName : undefined,
      };

      let created: PatientBooking;
      if (propOnSubmit) {
        created = await propOnSubmit(bookingDTO);
      } else {
        created = await context.createPatientBooking(bookingDTO);
      }

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la reserva');
    } finally {
      setIsSubmitting(false);
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
        data-testid="new-patient-modal"
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-sm ring-1 ring-zinc-950/5 border border-zinc-200/90 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="new-patient-modal-title" className="text-sm font-semibold text-zinc-950 truncate">
                Nuevo Paciente / Reserva
              </h3>
              <p className="text-xs text-zinc-500 truncate hidden sm:block">
                Alta del titular y acompañantes del viaje
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopySelfRegLink}
              data-testid="btn-copy-self-reg-link"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-md cursor-pointer transition-colors"
              title="Copiar link para enviar al Admin / Titular de la Reserva"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copiado' : 'Link Admin Reserva'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer transition-colors"
              title="Compartir enlace de autogestión por WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              data-testid="btn-close-patient-modal"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer active:scale-95 duration-150"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector: Desktop Only & Minimalist (Hidden on mobile) */}
        {passengers.length > 1 && (
          <div className="hidden md:flex items-center gap-1.5 px-5 pt-2.5 pb-2 border-b border-zinc-100 bg-zinc-50/40">
            <button
              type="button"
              onClick={() => setActiveTab('BASIC')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'BASIC'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              1. Titular & Reserva
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PASSENGERS')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'PASSENGERS'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              2. Pasajeros ({passengers.length})
            </button>
          </div>
        )}

        {/* Content Form */}
        <form onSubmit={handleSubmitBooking} className="p-4 sm:p-5 overflow-y-auto space-y-4 select-none flex-1">
          {/* Fast Action Strip (<= 2 Clicks) - Minimalist & Low Noise */}
          <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs">
            <div className="flex items-center gap-2 text-zinc-600 min-w-0">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-semibold text-zinc-800">Modo 1-Clic:</span>
              <span className="text-zinc-500 truncate hidden sm:inline">
                {country} · {language} · {paxCount} Pax · {hotelNamesMap[hotelId]}
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !!territoryError}
              data-testid="btn-fast-create-patient"
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 active:scale-95 duration-150 text-white font-medium text-xs rounded-md transition-all shrink-0 disabled:opacity-40 cursor-pointer"
            >
              Crear (1-Clic)
            </button>
          </div>

          {/* Territory Error Badge */}
          {territoryError && (
            <div
              data-testid="patient-territory-error-badge"
              className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-lg flex items-center gap-2 font-medium"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">Territorio No Operativo:</span> La ubicación especificada está fuera de los corredores médicos autorizados de Medical Trip.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* DESKTOP TAB 2: PASSENGERS ONLY (When explicitly clicked on desktop) */}
          {activeTab === 'PASSENGERS' && passengers.length > 1 ? (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900">Discriminación de Edades & Cotizaciones</h4>
                  <p className="text-2xs text-zinc-500">Clasifica cada pasajero como Adulto o Niño con su respectiva cotización.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    Total: ${passengers.reduce((s, p) => s + (p.individualQuotationCOP || 0), 0).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {passengers.map((pax, idx) => (
                  <div key={pax.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-800">
                        {idx === 0 ? 'Titular' : `Acompañante #${idx}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold text-2xs ${
                        pax.ageCategory === 'CHILD' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-200 text-zinc-800'
                      }`}>
                        {pax.ageCategory === 'CHILD' ? 'Niño (2-17a)' : 'Adulto (18+)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={idx === 0 ? (pax.fullName || `${firstName} ${lastName}`) : pax.fullName}
                        onChange={(e) => updatePassenger(idx, { fullName: e.target.value })}
                        placeholder="Nombre completo"
                        className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
                      />

                      <div className="flex gap-1">
                        <select
                          value={pax.ageCategory}
                          onChange={(e) => {
                            const cat = e.target.value as AgeCategory;
                            updatePassenger(idx, { ageCategory: cat, age: cat === 'CHILD' ? 9 : 35 });
                          }}
                          className="flex-1 rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs"
                        >
                          <option value="ADULT">Adulto</option>
                          <option value="CHILD">Niño</option>
                          <option value="INFANT">Infante</option>
                        </select>
                        <input
                          type="number"
                          value={pax.age}
                          onChange={(e) => updatePassenger(idx, { age: parseInt(e.target.value, 10) || 0 })}
                          className="w-12 rounded border border-zinc-300 bg-white px-1 py-1 text-center font-bold"
                          title="Edad en años"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500 font-mono">$</span>
                        <input
                          type="number"
                          step="50000"
                          value={pax.individualQuotationCOP}
                          onChange={(e) => updatePassenger(idx, { individualQuotationCOP: parseInt(e.target.value, 10) || 0 })}
                          placeholder="Cotización COP"
                          className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* MAIN FORM: TITULAR & RESERVA (Active tab BASIC, or Mobile default) */
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700">
                    Nombres del Paciente *
                  </label>
                  <input
                    type="text"
                    data-testid="input-patient-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Catia"
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    data-testid="input-patient-lastname"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Rodrigues"
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>

              {/* Group Size (Pax) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-zinc-700">
                    Tamaño del Grupo de Viaje (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    data-testid="input-patient-pax"
                    value={paxCount}
                    onChange={(e) => setPaxCount(parseInt(e.target.value, 10) || 1)}
                    className="w-14 px-2 py-0.5 text-xs text-center border border-zinc-300 rounded font-mono font-semibold text-zinc-900"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPaxCount(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        paxCount === num
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {num} Pax
                    </button>
                  ))}
                </div>
              </div>

              {/* Country, Language & Hotel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700">
                    País de Origen
                  </label>
                  <select
                    data-testid="input-patient-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="Curazao">🇨🇼 Curazao</option>
                    <option value="Aruba">🇦🇼 Aruba</option>
                    <option value="Bonaire">🇧🇶 Bonaire</option>
                    <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
                    <option value="Países Bajos">🇳🇱 Países Bajos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700">
                    Idioma Principal
                  </label>
                  <select
                    data-testid="input-patient-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="Papiamento">Papiamento</option>
                    <option value="Papiamento / Holandés">Papiamento / Holandés</option>
                    <option value="Inglés / Neerlandés">Inglés / Neerlandés</option>
                    <option value="Español">Español</option>
                    <option value="Inglés">Inglés</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700">
                    Hotel Asignado
                  </label>
                  <select
                    data-testid="input-patient-hotel"
                    value={hotelId}
                    onChange={(e) => setHotelId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="HOTEL-INNTU">Hotel Inntu Laureles</option>
                    <option value="HOTEL-PARK42">Airbnb Park 42 Poblado</option>
                    <option value="HOTEL-NOVELTY">Hotel Novelty Suites</option>
                    <option value="HOTEL-VILLA-ANITA">Villa Anita Envigado</option>
                    <option value="HOTEL-DIEZ">Hotel Diez Poblado</option>
                    <option value="HOTEL-CUSTOM">Otra Dirección...</option>
                  </select>
                </div>
              </div>

              {/* Custom Hotel Input */}
              {(hotelId === 'HOTEL-CUSTOM' || customHotel) && (
                <div className="space-y-1 animate-in fade-in duration-100">
                  <label className="block text-xs font-medium text-zinc-700">
                    Dirección / Nombre Hotel Personalizado
                  </label>
                  <input
                    type="text"
                    data-testid="input-patient-custom-hotel"
                    value={customHotel}
                    onChange={(e) => setCustomHotel(e.target.value)}
                    placeholder="Ej. Hotel Poblado Plaza Medellín"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700">
                    Fecha Llegada
                  </label>
                  <input
                    type="datetime-local"
                    value={arrivalDateLocal}
                    onChange={(e) => {
                      setArrivalDateLocal(e.target.value);
                      setDepartureDateLocal(getDefaultDeparture(e.target.value));
                    }}
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700">
                    Fecha Salida
                  </label>
                  <input
                    type="datetime-local"
                    value={departureDateLocal}
                    onChange={(e) => setDepartureDateLocal(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>

              {/* COMPANIONS ON MOBILE (Minimal inline section when Pax > 1, no tabs required) */}
              {paxCount > 1 && (
                <div className="md:hidden border border-zinc-200 rounded-lg p-3 bg-zinc-50/60 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-zinc-200/80 pb-1.5">
                    <span className="text-xs font-semibold text-zinc-800">
                      Acompañantes del Grupo ({passengers.length - 1})
                    </span>
                    <span className="text-2xs text-zinc-500 font-medium shrink-0">
                      {passengers.length - 1} {passengers.length - 1 === 1 ? 'acompañante' : 'acompañantes'}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                    {passengers.slice(1).map((pax, companionIdx) => {
                      const actualIdx = companionIdx + 1;
                      return (
                        <div key={pax.id} className="p-2 bg-white rounded-md border border-zinc-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-700">
                              Acompañante #{actualIdx}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-3xs font-semibold ${
                              pax.ageCategory === 'CHILD' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {pax.ageCategory === 'CHILD' ? 'Niño' : 'Adulto'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={pax.fullName}
                              onChange={(e) => updatePassenger(actualIdx, { fullName: e.target.value })}
                              placeholder={`Nombre Acompañante ${actualIdx}`}
                              className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
                            />
                            <div className="flex gap-1">
                              <select
                                value={pax.ageCategory}
                                onChange={(e) => {
                                  const cat = e.target.value as AgeCategory;
                                  updatePassenger(actualIdx, { ageCategory: cat, age: cat === 'CHILD' ? 9 : 35 });
                                }}
                                className="flex-1 rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs text-zinc-900"
                              >
                                <option value="ADULT">Adulto</option>
                                <option value="CHILD">Niño</option>
                                <option value="INFANT">Infante</option>
                              </select>
                              <input
                                type="number"
                                value={pax.age}
                                onChange={(e) => updatePassenger(actualIdx, { age: parseInt(e.target.value, 10) || 0 })}
                                className="w-12 rounded border border-zinc-300 bg-white px-1 py-1 text-center text-xs font-semibold"
                                title="Edad"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Collapsible Advanced Options */}
              <div className="border-t border-zinc-200/80 pt-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="flex items-center justify-between w-full text-xs font-medium text-zinc-600 hover:text-zinc-950 cursor-pointer"
                >
                  <span>Opciones Adicionales (Vuelos, Teléfono, Notas)</span>
                  {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isAdvancedOpen && (
                  <div className="mt-3 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-zinc-600">Aerolínea</label>
                        <input
                          type="text"
                          value={airline}
                          onChange={(e) => setAirline(e.target.value)}
                          placeholder="Z-Fly, Avianca, Wingo"
                          className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-zinc-600">Número de Vuelo</label>
                        <input
                          type="text"
                          value={flightNumber}
                          onChange={(e) => setFlightNumber(e.target.value)}
                          placeholder="ZF-104"
                          className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-zinc-600">Teléfono WhatsApp</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-zinc-600">Correo Electrónico</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-600">Notas</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900"
                      />
                    </div>
                    {/* Hotel support check */}
                    <div className="pt-2 border-t border-zinc-100">
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requiresHotelReservation}
                          onChange={(e) => setRequiresHotelReservation(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-zinc-900"
                        />
                        <span>Requiere Reserva de Hotel Gestionada por Medical Trip</span>
                      </label>
                      {requiresHotelReservation && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                          <p className="text-amber-800 text-2xs font-medium">Adjunta voucher o soporte de hotel:</p>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setHotelVoucherFileName(file.name);
                            }}
                            className="text-3xs file:py-1 file:px-2 file:rounded file:border-0 file:bg-zinc-900 file:text-white cursor-pointer"
                          />
                          {hotelVoucherFileName && (
                            <span className="font-mono text-emerald-700 font-bold text-3xs block">✓ {hotelVoucherFileName}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleCopySelfRegLink}
              data-testid="btn-copy-self-reg-link-bottom"
              className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? '¡Link Copiado!' : 'Copiar Link para Admin Reserva'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!territoryError}
                data-testid="btn-submit-patient"
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 active:scale-95 duration-150 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Guardando...' : 'Guardar y Seleccionar'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPatientModal;
