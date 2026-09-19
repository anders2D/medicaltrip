/**
 * Medical Trip Colombia S.A.S. - PatientSelfRegistrationView
 * Vista pública y responsive de Autogestión y Registro para Pacientes Internacionales.
 * Flujo autoservicio sin necesidad de credenciales de coordinador:
 * - Detección y saludo con Nombre Preasignado por el Coordinador (Invitación vía Link).
 * - Clasificación estricta de Pasajeros: Paciente (recibe atención médica) vs Acompañante (apoyo familiar).
 * - Trazabilidad hotelera completa (camas requeridas, tipo de habitación, movilidad y restricciones dietarias).
 * - Discriminación de edades (Adultos, Niños, Infantes) y encuestas médicas.
 * - Arquitectura Hexagonal desacoplada con guardado en LocalStorage/Dexie y lista para Supabase.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  User,
  Users,
  Building2,
  Upload,
  HeartPulse,
  Pill,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Bed,
  Stethoscope,
  Utensils,
} from 'lucide-react';
import { CreatePatientBookingUseCase } from '../application/CreatePatientBookingUseCase';
import { GetPatientInvitationUseCase } from '../application/GetPatientInvitationUseCase';
import { ServiceContainer } from '@/core/infrastructure';
import {
  PassengerRecord,
  AgeCategory,
  PassengerRole,
  RoomPreference,
  PatientBooking,
} from '@/core/domain';
import { OperativeTerritory } from '@/core/domain';

export interface PatientSelfRegistrationViewProps {
  initialToken?: string;
  initialName?: string;
  initialCountry?: string;
  initialLanguage?: string;
  initialEstimatedDate?: string;
  onComplete?: (booking: PatientBooking) => void;
  onExit?: () => void;
}

export const PatientSelfRegistrationView: React.FC<PatientSelfRegistrationViewProps> = ({
  initialToken,
  initialName,
  initialCountry,
  initialLanguage,
  initialEstimatedDate,
  onComplete,
  onExit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedBooking, setCompletedBooking] = useState<PatientBooking | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Invitation Token State
  const [token, setToken] = useState<string>(() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('invitation') || '';
    }
    return '';
  });

  // Form State: Titular & Vuelo
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('Curazao');
  const [language, setLanguage] = useState('Papiamento');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [arrivalDate, setArrivalDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [airline, setAirline] = useState('Z-Fly');
  const [flightNumber, setFlightNumber] = useState('ZF-104');

  // Hotel & Acomodación
  const [requiresHotel, setRequiresHotel] = useState<boolean>(false);
  const [selectedHotel, setSelectedHotel] = useState<string>('Hotel Inntu Laureles');
  const [hotelVoucherFileName, setHotelVoucherFileName] = useState<string>('');
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(false);
  const [medicalSpecialty, setMedicalSpecialty] = useState<string>('Oftalmología');
  const [medicalNotes, setMedicalNotes] = useState<string>('Consulta oftalmológica integral y cirugía refractiva de córnea.');

  // Pasajeros (Titular + Acompañantes con discriminación de roles y hotel)
  const [passengers, setPassengers] = useState<PassengerRecord[]>([
    {
      id: 'pax-primary',
      fullName: '',
      age: 40,
      ageCategory: 'ADULT',
      role: 'PATIENT',
      passportNumber: '',
      relationshipWithPrimary: 'Titular',
      requiresHotelBed: true,
      roomPreference: 'SINGLE',
      dietaryRestrictions: '',
      mobilityNeeds: '',
      individualQuotationCOP: 12000000,
      medicalSurvey: {
        hasPreexistingConditions: false,
        conditionsDescription: '',
        takesMedications: false,
        medicationsList: '',
        specialRequirements: [],
        specialRequirementsNotes: '',
      },
      documents: {
        passportFileName: '',
        medicalSurveyFileName: '',
        flightTicketFileName: '',
      },
    },
  ]);

  // Cargar invitación al montar componente si existe token o nombre en la URL / props
  useEffect(() => {
    const loadInvitationData = async () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const activeToken = token || params.get('token') || params.get('invitation') || '';
      const fallbackName = initialName || params.get('name') || '';
      const fallbackCountry = initialCountry || params.get('country') || '';
      const fallbackLang = initialLanguage || params.get('lang') || '';
      const fallbackDate = initialEstimatedDate || params.get('date') || '';

      if (activeToken || fallbackName) {
        const repo = ServiceContainer.getInvitationRepository();
        const useCase = new GetPatientInvitationUseCase(repo);
        const inv = await useCase.execute({
          token: activeToken || 'INV-DIRECT',
          fallbackName,
          fallbackCountry,
          fallbackLanguage: fallbackLang,
          fallbackDate,
        });

        if (inv) {
          setToken(inv.token);
          const nameParts = inv.patientName.trim().split(' ');
          const first = nameParts[0] || '';
          const last = nameParts.slice(1).join(' ') || '';
          setFirstName(first);
          setLastName(last);
          if (inv.country) setCountry(inv.country);
          if (inv.language) setLanguage(inv.language);
          if (inv.phone) setPhone(inv.phone);
          if (inv.email) setEmail(inv.email);
          if (inv.estimatedArrivalDate) {
            setArrivalDate(inv.estimatedArrivalDate);
            const d = new Date(inv.estimatedArrivalDate);
            d.setDate(d.getDate() + 7);
            setDepartureDate(d.toISOString().slice(0, 10));
          }

          setPassengers((prev) => {
            const copy = [...prev];
            copy[0] = {
              ...copy[0],
              fullName: inv.patientName,
              role: 'PATIENT',
              relationshipWithPrimary: 'Titular',
            };
            return copy;
          });
        }
      }
    };

    loadInvitationData();
  }, []);

  // Actualizar pasajero
  const updatePassenger = (index: number, updates: Partial<PassengerRecord>) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Actualizar encuesta de pasajero
  const updatePassengerSurvey = (
    index: number,
    surveyUpdates: Partial<PassengerRecord['medicalSurvey']>
  ) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        medicalSurvey: {
          ...copy[index].medicalSurvey,
          ...surveyUpdates,
        },
      };
      return copy;
    });
  };

  // Actualizar documentos de pasajero
  const updatePassengerDocs = (
    index: number,
    docUpdates: Partial<NonNullable<PassengerRecord['documents']>>
  ) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        documents: {
          ...copy[index].documents,
          ...docUpdates,
        },
      };
      return copy;
    });
  };

  // Agregar acompañante / viajero adicional
  const addPassenger = (
    category: AgeCategory = 'ADULT',
    defaultRole: PassengerRole = 'COMPANION'
  ) => {
    const newIdx = passengers.length;
    const defaultAge = category === 'CHILD' ? 8 : category === 'INFANT' ? 1 : 35;
    const defaultQuote = category === 'CHILD' ? 1500000 : 2500000;
    setPassengers((prev) => [
      ...prev,
      {
        id: `pax-${Date.now()}-${newIdx}`,
        fullName: '',
        age: defaultAge,
        ageCategory: category,
        role: defaultRole,
        passportNumber: '',
        relationshipWithPrimary: defaultRole === 'PATIENT' ? 'Paciente Adicional' : 'Acompañante',
        requiresHotelBed: true,
        roomPreference: 'DOUBLE_SHARED',
        dietaryRestrictions: '',
        mobilityNeeds: '',
        individualQuotationCOP: defaultQuote,
        medicalSurvey: {
          hasPreexistingConditions: false,
          conditionsDescription: '',
          takesMedications: false,
          medicationsList: '',
          specialRequirements: [],
        },
        documents: {
          passportFileName: '',
          medicalSurveyFileName: '',
          flightTicketFileName: '',
        },
      },
    ]);
  };

  // Remover acompañante
  const removePassenger = (index: number) => {
    if (index === 0) return; // No se puede remover el titular
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  };

  // Copiar link de autogestión
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?registro=true${
      token ? `&token=${token}` : ''
    }`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Métricas calculadas en tiempo real
  const metrics = useMemo(() => {
    const total = passengers.length;
    const patients = passengers.filter((p) => p.role === 'PATIENT').length;
    const companions = passengers.filter((p) => p.role === 'COMPANION').length;
    const hotelGuests = passengers.filter((p) => p.requiresHotelBed !== false).length;
    const singleRooms = passengers.filter(
      (p) => p.requiresHotelBed !== false && p.roomPreference === 'SINGLE'
    ).length;
    const sharedGuests = passengers.filter(
      (p) =>
        p.requiresHotelBed !== false &&
        (p.roomPreference === 'DOUBLE_SHARED' || p.roomPreference === 'TWIN' || !p.roomPreference)
    ).length;
    const estimatedRooms = singleRooms + Math.ceil(sharedGuests / 2);

    return {
      total,
      patients,
      companions,
      hotelGuests,
      estimatedRooms,
    };
  }, [passengers]);

  // Enviar registro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas
    if (!firstName.trim() || !lastName.trim()) {
      setError('Por favor ingresa tu nombre y apellido completo.');
      setCurrentStep(1);
      return;
    }

    if (!privacyConsent) {
      setError('Por favor acepta la política de privacidad y consentimiento médico para continuar.');
      setCurrentStep(4);
      return;
    }

    // Actualizar nombre del titular en passengers[0]
    const updatedPassengers = [...passengers];
    updatedPassengers[0].fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Validar nombres de acompañantes
    for (let i = 1; i < updatedPassengers.length; i++) {
      if (!updatedPassengers[i].fullName.trim()) {
        updatedPassengers[i].fullName = `Acompañante ${i} (${
          updatedPassengers[i].ageCategory === 'CHILD' ? 'Niño' : 'Adulto'
        })`;
      }
    }

    setIsSubmitting(true);
    try {
      const storage = ServiceContainer.getStoragePort();
      const useCase = new CreatePatientBookingUseCase(storage);

      const effectiveHotel = requiresHotel ? selectedHotel : 'Hotel Inntu Laureles';
      OperativeTerritory.fromString(effectiveHotel);

      const arrivalIso = `${arrivalDate}T10:00:00.000Z`;
      const departureIso = `${departureDate}T18:00:00.000Z`;

      const result = await useCase.execute({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        patientName: `${firstName.trim()} ${lastName.trim()}`,
        country,
        language,
        phone: phone || '+5999 500 0000',
        email: email || `${firstName.toLowerCase().replace(/\s+/g, '')}@paciente.medicaltrip.test`,
        paxCount: updatedPassengers.length,
        arrivalDate: arrivalIso,
        departureDate: departureIso,
        airline,
        flightNumber,
        arrivalAirline: airline,
        arrivalFlight: flightNumber,
        hotel: effectiveHotel,
        hotelName: effectiveHotel,
        companionNames: updatedPassengers.slice(1).map((p) => p.fullName),
        passengers: updatedPassengers,
        requiresHotelReservation: requiresHotel,
        hotelVoucherFileName: requiresHotel ? (hotelVoucherFileName || 'solicitud-coordinacion-hotel.pdf') : undefined,
        notes: `Auto-registro vía Enlace de Autogestión. Especialidad: ${medicalSpecialty}. Notas: ${medicalNotes}. ${metrics.patients} pacientes, ${metrics.companions} acompañantes.`,
      });

      // Si se originó con un token de invitación, marcarlo como completado en el repositorio
      if (token) {
        const repo = ServiceContainer.getInvitationRepository();
        await repo.markAsCompleted(token, result.booking.code);
      }

      setCompletedBooking(result.booking);
      if (onComplete) onComplete(result.booking);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de éxito
  if (completedBooking) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Registro Completado con Éxito
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 mt-3">
              ¡Bienvenido/a, {completedBooking.fullName}!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1.5">
              Tu solicitud de viaje médico ha sido recibida y registrada en nuestro sistema de coordinación.
            </p>
          </div>

          {/* Tarjeta de Código de Reserva */}
          <div className="bg-zinc-900 text-white rounded-xl p-4 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Código de Reserva</span>
              <span className="text-xs font-mono font-bold bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded">
                CONFIRMADO
              </span>
            </div>
            <div data-testid="booking-reference-code" className="text-2xl font-mono font-black tracking-wider text-emerald-400">
              {completedBooking.code}
            </div>
            <div className="text-xs text-zinc-300 border-t border-zinc-800 pt-2 flex items-center justify-between">
              <span>
                {completedBooking.country} · {completedBooking.language}
              </span>
              <span>
                {completedBooking.paxCount} Viajeros ({completedBooking.patientsCount} Pacientes,{' '}
                {completedBooking.companionsCount} Acompañantes)
              </span>
            </div>
          </div>

          {/* Resumen de Pasajeros y Hotelería */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Desglose de Pasajeros & Hotelería
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {completedBooking.hotelGuestsCount} en hotel · ~{completedBooking.hotelRoomsNeededEstimate} hab(s)
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {completedBooking.passengers.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-white border border-zinc-100"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.role === 'PATIENT'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {p.role === 'PATIENT' ? '🏥 Paciente' : '👥 Acompañante'}
                    </span>
                    <span className="text-zinc-800 font-medium">{p.fullName || `Pasajero ${idx + 1}`}</span>
                  </div>
                  <span className="text-zinc-500 text-[11px]">
                    {p.requiresHotelBed !== false
                      ? p.roomPreference === 'SINGLE'
                        ? 'Hab. Individual'
                        : 'Hab. Doble'
                      : 'Sin hotel'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                if (onExit) {
                  onExit();
                } else {
                  window.location.href = window.location.origin + window.location.pathname;
                }
              }}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Ir al Inicio / Iniciar Sesión Coordinador
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="patient-self-registration-root" className="min-h-screen bg-zinc-50 flex flex-col justify-between py-6 px-3 sm:px-6">
      {/* Top Header */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between pb-4 border-b border-zinc-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-zinc-950">
              Medical Trip Colombia · Autogestión de Paciente
            </h1>
            <p className="text-xs text-zinc-500">
              Registro de viaje médico, clasificación de acompañantes y requerimientos de hotel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            data-testid="btn-copy-self-registration-link"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Copiar enlace directo de este formulario"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span>{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
          </button>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>
      </header>

      {/* Saludo Personalizado si hay nombre preasignado */}
      {(firstName || token) && (
        <div className="w-full max-w-3xl mx-auto mt-4">
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {firstName ? firstName[0] : 'P'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
                    Invitación de Registro
                  </span>
                  {token && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {token}
                    </span>
                  )}
                </div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 mt-0.5">
                  Hola, {firstName} {lastName}
                </h2>
                <p className="text-xs text-zinc-600">
                  Completa tus datos y añade a tus acompañantes indicando quiénes recibirán tratamiento médico y quiénes viajan de apoyo.
                </p>
              </div>
            </div>

            {/* Contador en vivo */}
            <div className="flex items-center gap-2 text-xs self-end sm:self-center">
              <span data-testid="live-travelers-counter" className="px-2 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 font-mono text-xs">
                {`👥 ${metrics.total} ${metrics.total === 1 ? 'viajero' : 'viajeros'}`}
              </span>
              <span data-testid="live-patients-counter" className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs">
                {`🏥 ${metrics.patients} pac`}
              </span>
              <span data-testid="live-companions-counter" className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-mono text-xs">
                {`🤝 ${metrics.companions} acomp`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Wizard Container */}
      <main className="w-full max-w-3xl mx-auto my-4 bg-white rounded-2xl border border-zinc-200 shadow-xs flex-1 flex flex-col overflow-hidden">
        {/* Wizard Progress Bar */}
        <div className="flex border-b border-zinc-100 bg-zinc-50/70 px-4 py-2.5 overflow-x-auto gap-2">
          {[
            { step: 1, title: 'Datos Generales', icon: User },
            { step: 2, title: 'Acompañantes y Pasajeros', icon: Users },
            { step: 3, title: 'Consulta Médica', icon: HeartPulse },
            { step: 4, title: 'Alojamiento y Cierre', icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.step;
            const isDone = currentStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white font-bold shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {item.step}. {item.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Titular & Vuelo */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">1. Datos Personales y Fechas de Viaje</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ingresa los datos del paciente titular que lidera el viaje médico a Medellín.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Nombres *</label>
                  <input
                    type="text"
                    required
                    data-testid="self-reg-firstname"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Catia"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Apellidos *</label>
                  <input
                    type="text"
                    required
                    data-testid="self-reg-lastname"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Rodrigues"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">País de Residencia</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 cursor-pointer"
                  >
                    <option value="Curazao">🇨🇼 Curazao</option>
                    <option value="Aruba">🇦🇼 Aruba</option>
                    <option value="Bonaire">🇧🇶 Bonaire</option>
                    <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
                    <option value="Países Bajos">🇳🇱 Países Bajos</option>
                    <option value="Sint Maarten">🇸🇽 Sint Maarten</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Idioma de Preferencia</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 cursor-pointer"
                  >
                    <option value="Papiamento">Papiamento</option>
                    <option value="Papiamento / Holandés">Papiamento / Holandés</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Español">Español</option>
                    <option value="Neerlandés">Neerlandés</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Teléfono WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+5999 512 3456"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@correo.com"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Fecha de Llegada a Medellín</label>
                  <input
                    type="date"
                    required
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Fecha Estimada de Regreso</label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Aerolínea</label>
                  <input
                    type="text"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    placeholder="Z-Fly, Avianca, Wingo, Copa"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Número de Vuelo</label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="ZF-104"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Pasajeros & Clasificación de Roles (Paciente vs Acompañante) */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    2. Acompañantes y Pasajeros (Clasificación de Roles)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Indica quiénes recibirán tratamiento médico y quiénes viajan como apoyo o familiares.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => addPassenger('ADULT', 'COMPANION')}
                    data-testid="btn-add-adult"
                    className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Adulto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addPassenger('CHILD', 'COMPANION')}
                    data-testid="btn-add-child"
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Niño</span>
                  </button>
                </div>
              </div>

              {/* Banner de Conteo de Viajeros */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-700" data-testid="group-travelers-summary">
                  Resumen de Grupo: {metrics.total} {metrics.total === 1 ? 'viajero' : 'viajeros'}
                </span>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                    🏥 {metrics.patients} {metrics.patients === 1 ? 'Paciente' : 'Pacientes'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    👥 {metrics.companions} {metrics.companions === 1 ? 'Acompañante' : 'Acompañantes'}
                  </span>
                </div>
              </div>

              {/* Lista de Pasajeros */}
              <div className="space-y-3.5">
                {passengers.map((pax, idx) => (
                  <div
                    key={pax.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-zinc-900">
                          {idx === 0 ? 'Viajero Principal (Titular)' : `Viajero #${idx + 1}`}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                            pax.ageCategory === 'CHILD'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : pax.ageCategory === 'INFANT'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          {pax.ageCategory === 'CHILD'
                            ? 'Niño (2-17a)'
                            : pax.ageCategory === 'INFANT'
                            ? 'Infante (<2a)'
                            : 'Adulto (18+)'}
                        </span>
                      </div>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(idx)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    {/* SELECTOR DE ROL: PACIENTE vs ACOMPAÑANTE */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-semibold text-zinc-700">
                        ¿Cuál es el rol de esta persona en el viaje? <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updatePassenger(idx, { role: 'PATIENT' })}
                          data-testid={`btn-role-patient-${idx}`}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                            pax.role === 'PATIENT'
                              ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 font-bold ring-2 ring-indigo-400/20'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <Stethoscope
                            className={`w-4 h-4 shrink-0 ${
                              pax.role === 'PATIENT' ? 'text-indigo-600' : 'text-zinc-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight">🏥 Paciente</div>
                            <div className="text-[10px] text-zinc-500 truncate">
                              Recibirá atención / cirugía
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => updatePassenger(idx, { role: 'COMPANION' })}
                          data-testid={`btn-role-companion-${idx}`}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                            pax.role === 'COMPANION'
                              ? 'bg-amber-50/90 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-400/20'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <Users
                            className={`w-4 h-4 shrink-0 ${
                              pax.role === 'COMPANION' ? 'text-amber-600' : 'text-zinc-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight">👥 Acompañante</div>
                            <div className="text-[10px] text-zinc-500 truncate">
                              Viaje de apoyo familiar
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600">Nombre Completo</label>
                        <input
                          type="text"
                          value={
                            idx === 0
                              ? pax.fullName || `${firstName} ${lastName}`.trim()
                              : pax.fullName
                          }
                          onChange={(e) => updatePassenger(idx, { fullName: e.target.value })}
                          placeholder={
                            idx === 0
                              ? `${firstName || 'Nombre'} ${lastName || 'Apellido'}`
                              : 'Ej. Pedro Gomez'
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900"
                          data-testid={`input-passenger-name-${idx}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-600">Pasaporte / Doc</label>
                        <input
                          type="text"
                          value={pax.passportNumber || ''}
                          onChange={(e) => updatePassenger(idx, { passportNumber: e.target.value })}
                          placeholder="Ej. N12345678"
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono text-zinc-900"
                          data-testid={`input-passenger-passport-${idx}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-600">Parentesco / Relación</label>
                        <input
                          type="text"
                          value={pax.relationshipWithPrimary || ''}
                          onChange={(e) =>
                            updatePassenger(idx, { relationshipWithPrimary: e.target.value })
                          }
                          placeholder={idx === 0 ? 'Titular' : 'Ej. Cónyuge, Hijo/a, Amigo/a'}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600">Categoría & Edad</label>
                        <div className="flex gap-1.5">
                          <select
                            value={pax.ageCategory}
                            onChange={(e) => {
                              const cat = e.target.value as AgeCategory;
                              const newAge = cat === 'CHILD' ? 9 : cat === 'INFANT' ? 1 : 35;
                              updatePassenger(idx, { ageCategory: cat, age: newAge });
                            }}
                            className="flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 cursor-pointer"
                          >
                            <option value="ADULT">Adulto</option>
                            <option value="CHILD">Niño</option>
                            <option value="INFANT">Infante</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={pax.age}
                            onChange={(e) =>
                              updatePassenger(idx, { age: parseInt(e.target.value) || 0 })
                            }
                            className="w-16 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 text-center"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-600">
                          Cotización Estimada (COP)
                        </label>
                        <input
                          type="number"
                          step={100000}
                          value={pax.individualQuotationCOP}
                          onChange={(e) =>
                            updatePassenger(idx, {
                              individualQuotationCOP: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono text-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Encuesta Médica y Requerimientos */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">
                  3. Consulta Médica y Encuesta por Pasajero
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Información clínica vital para coordinar traslados en ambulancia o vehículos adaptados.
                </p>
              </div>

              {/* Especialidad Médica y Notas de Consulta */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Especialidad Médica Solicitada *</label>
                  <select
                    data-testid="select-medical-specialty"
                    value={medicalSpecialty}
                    onChange={(e) => setMedicalSpecialty(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 cursor-pointer"
                  >
                    <option value="Oftalmología">👁️ Oftalmología (Glaucornea / Dr. Lukas Saldarriaga)</option>
                    <option value="Cirugía Plástica">✨ Cirugía Plástica & Reconstructiva</option>
                    <option value="Cardiología">❤️ Cardiología Intervencionista</option>
                    <option value="Odontología">🦷 Odontología & Rehabilitación Oral</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-700">Motivo de Consulta y Notas Médicas</label>
                  <textarea
                    data-testid="textarea-medical-notes"
                    rows={3}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="Describe el motivo de la consulta..."
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {passengers.map((pax, idx) => (
                  <div
                    key={pax.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-zinc-900">
                          {pax.fullName || `Pasajero #${idx + 1}`}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            pax.role === 'PATIENT'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pax.role === 'PATIENT' ? '🏥 Paciente' : '👥 Acompañante'}
                        </span>
                      </div>
                    </div>

                    {/* Enfermedades Preexistentes */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                          <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                          <span>¿Tiene enfermedades preexistentes o cirugías previas?</span>
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updatePassengerSurvey(idx, {
                                hasPreexistingConditions: false,
                                conditionsDescription: '',
                              })
                            }
                            className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                              !pax.medicalSurvey.hasPreexistingConditions
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updatePassengerSurvey(idx, { hasPreexistingConditions: true })
                            }
                            className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                              pax.medicalSurvey.hasPreexistingConditions
                                ? 'bg-rose-600 text-white'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            Sí
                          </button>
                        </div>
                      </div>

                      {pax.medicalSurvey.hasPreexistingConditions && (
                        <input
                          type="text"
                          value={pax.medicalSurvey.conditionsDescription || ''}
                          onChange={(e) =>
                            updatePassengerSurvey(idx, { conditionsDescription: e.target.value })
                          }
                          placeholder="Detalle enfermedades: ej. Hipertensión, Diabetes, Asma, Cirugías previas..."
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900"
                        />
                      )}
                    </div>

                    {/* Toma de Medicamentos */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-indigo-500" />
                          <span>¿Toma medicamentos actualmente?</span>
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updatePassengerSurvey(idx, {
                                takesMedications: false,
                                medicationsList: '',
                              })
                            }
                            className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                              !pax.medicalSurvey.takesMedications
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updatePassengerSurvey(idx, { takesMedications: true })
                            }
                            className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                              pax.medicalSurvey.takesMedications
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            Sí
                          </button>
                        </div>
                      </div>

                      {pax.medicalSurvey.takesMedications && (
                        <input
                          type="text"
                          value={pax.medicalSurvey.medicationsList || ''}
                          onChange={(e) =>
                            updatePassengerSurvey(idx, { medicationsList: e.target.value })
                          }
                          placeholder="Tipo de medicamentos, dosis y frecuencia: ej. Losartán 50mg cada 24h, Insulina 10 UI..."
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900"
                        />
                      )}
                    </div>

                    {/* Requerimientos Especiales */}
                    <div className="pt-2 border-t border-zinc-200 space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-800">
                        Requerimientos Especiales de Movilidad y Asistencia
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'WHEELCHAIR', label: '♿ Silla de Ruedas' },
                          { id: 'OXYGEN', label: '🫁 Oxígeno Medicinal' },
                          { id: 'DIETARY', label: '🥗 Dieta Especial' },
                          { id: 'RAMP_ASSIST', label: '🚶 Asistencia de Movilidad' },
                        ].map((req) => {
                          const currentReqs = pax.medicalSurvey.specialRequirements || [];
                          const isSelected = currentReqs.includes(req.id);
                          return (
                            <button
                              key={req.id}
                              type="button"
                              onClick={() => {
                                const nextReqs = isSelected
                                  ? currentReqs.filter((r) => r !== req.id)
                                  : [...currentReqs, req.id];
                                updatePassengerSurvey(idx, { specialRequirements: nextReqs });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                              }`}
                            >
                              {req.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Hotelería, Acomodación & Soportes */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">
                  4. Alojamiento y Cierre (Hotel & Consentimiento PHI)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Gestiona la contratación del hotel para todo el grupo y carga los soportes de viaje.
                </p>
              </div>

              {/* SECCIÓN DE HOTEL & ACOMODACIÓN */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-zinc-700" />
                    <span className="text-xs font-bold text-zinc-900">
                      ¿Requiere Reserva de Hotel Gestionada por Medical Trip?
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requiresHotel}
                    onChange={(e) => setRequiresHotel(e.target.checked)}
                    className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-950 cursor-pointer"
                    data-testid="checkbox-requires-hotel"
                  />
                </div>

                {requiresHotel && (
                  <div className="space-y-4 pt-2 border-t border-zinc-200 animate-in fade-in duration-100">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Hotel Seleccionado para la Estadía
                      </label>
                      <select
                        value={selectedHotel}
                        onChange={(e) => setSelectedHotel(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 cursor-pointer font-medium"
                      >
                        <option value="Hotel Inntu Laureles">Hotel Inntu Laureles (Recomendado)</option>
                        <option value="Airbnb Ed. Park 42 Poblado">Airbnb Ed. Park 42 Poblado</option>
                        <option value="Hotel Novelty Suites Poblado">Hotel Novelty Suites Poblado</option>
                        <option value="Villa Anita Envigado">Villa Anita Envigado (Recuperación)</option>
                      </select>
                    </div>

                    {/* Resumen Estimado de Habitaciones */}
                    <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Bed className="w-4 h-4 text-zinc-600" />
                        <span className="font-semibold text-zinc-800">
                          Huéspedes a alojar: <b>{metrics.hotelGuests}</b>
                        </span>
                      </div>
                      <span className="font-mono text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-md font-bold">
                        ~ {metrics.estimatedRooms} {metrics.estimatedRooms === 1 ? 'Habitación' : 'Habitaciones'} Requeridas
                      </span>
                    </div>

                    {/* Desglose de Cama y Habitación por Pasajero */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                        Distribución de Acomodación por Viajero
                      </div>

                      {passengers.map((pax, idx) => (
                        <div
                          key={pax.id}
                          className="p-3 bg-white rounded-xl border border-zinc-200 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">
                                {pax.fullName || `Pasajero #${idx + 1}`}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  pax.role === 'PATIENT'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {pax.role === 'PATIENT' ? 'Paciente' : 'Acompañante'}
                              </span>
                            </div>

                            <label className="flex items-center gap-1.5 text-zinc-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pax.requiresHotelBed !== false}
                                onChange={(e) =>
                                  updatePassenger(idx, { requiresHotelBed: e.target.checked })
                                }
                                className="w-3.5 h-3.5 rounded text-zinc-900"
                              />
                              <span className="text-[11px] font-medium">Requiere cama</span>
                            </label>
                          </div>

                          {pax.requiresHotelBed !== false && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                              <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-0.5">
                                  Preferencia de Habitación
                                </label>
                                <select
                                  value={pax.roomPreference || 'DOUBLE_SHARED'}
                                  onChange={(e) =>
                                    updatePassenger(idx, {
                                      roomPreference: e.target.value as RoomPreference,
                                    })
                                  }
                                  className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs bg-zinc-50"
                                >
                                  <option value="SINGLE">Individual (1 sola persona)</option>
                                  <option value="DOUBLE_SHARED">Doble (Cama Matrimonial)</option>
                                  <option value="TWIN">Doble (Camas Separadas)</option>
                                  <option value="EXTRA_BED">Cama Adicional / Cuna</option>
                                  <option value="NONE">No requiere cama extra</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-0.5 flex items-center gap-1">
                                  <Utensils className="w-3 h-3 text-zinc-500" />
                                  Dietas / Desayunos Hotel
                                </label>
                                <input
                                  type="text"
                                  value={pax.dietaryRestrictions || ''}
                                  onChange={(e) =>
                                    updatePassenger(idx, { dietaryRestrictions: e.target.value })
                                  }
                                  placeholder="Ej. Celíaco, vegetariano..."
                                  className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs bg-zinc-50"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Soporte de Hotel */}
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Soporte Obligatorio de Hotel</span>
                      </div>
                      <p className="text-xs text-amber-800">
                        Al solicitar reserva de hotel, se debe adjuntar el voucher o confirmación de hospedaje.
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setHotelVoucherFileName(file.name);
                        }}
                        className="text-xs text-zinc-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer"
                      />
                      {hotelVoucherFileName && (
                        <div className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Adjuntado: {hotelVoucherFileName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Consentimiento de Privacidad y PHI */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                <label className="flex items-start gap-2.5 text-xs text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    data-testid="checkbox-privacy-consent"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                  />
                  <span className="leading-snug">
                    Acepto la política de privacidad, consentimiento informado y tratamiento confidencial de datos médicos (cumplimiento PHI / HIPAA) para Medical Trip Colombia S.A.S.
                  </span>
                </label>
              </div>

              {/* Adjuntos por Pasajero (Pasaporte, Encuesta, Vuelo) */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Soportes Obligatorios por Pasajero (Pasaporte, Encuesta, Vuelo)
                </div>

                {passengers.map((pax, idx) => (
                  <div
                    key={pax.id}
                    className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2.5"
                  >
                    <div className="text-xs font-bold text-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>{pax.fullName || `Pasajero #${idx + 1}`}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            pax.role === 'PATIENT'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pax.role === 'PATIENT' ? 'Paciente' : 'Acompañante'}
                        </span>
                      </div>
                      <span className="text-xs font-normal text-zinc-500 font-mono">
                        {pax.ageCategory === 'CHILD' ? 'Niño' : 'Adulto'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {/* Pasaporte */}
                      <div className="p-2 border border-zinc-200 rounded-lg bg-zinc-50 space-y-1">
                        <span className="font-semibold text-zinc-700 block">1. Pasaporte</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updatePassengerDocs(idx, { passportFileName: file.name });
                          }}
                          className="text-xs text-zinc-500 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-2xs file:bg-zinc-200 file:text-zinc-800 cursor-pointer w-full"
                        />
                        {pax.documents?.passportFileName && (
                          <span className="text-2xs font-mono text-emerald-700 block truncate">
                            ✓ {pax.documents.passportFileName}
                          </span>
                        )}
                      </div>

                      {/* Encuesta Médica */}
                      <div className="p-2 border border-zinc-200 rounded-lg bg-zinc-50 space-y-1">
                        <span className="font-semibold text-zinc-700 block">2. Encuesta Médica</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updatePassengerDocs(idx, { medicalSurveyFileName: file.name });
                          }}
                          className="text-xs text-zinc-500 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-2xs file:bg-zinc-200 file:text-zinc-800 cursor-pointer w-full"
                        />
                        {pax.documents?.medicalSurveyFileName && (
                          <span className="text-2xs font-mono text-emerald-700 block truncate">
                            ✓ {pax.documents.medicalSurveyFileName}
                          </span>
                        )}
                      </div>

                      {/* Tiquete de Vuelo */}
                      <div className="p-2 border border-zinc-200 rounded-lg bg-zinc-50 space-y-1">
                        <span className="font-semibold text-zinc-700 block">3. Tiquete de Vuelo</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updatePassengerDocs(idx, { flightTicketFileName: file.name });
                          }}
                          className="text-xs text-zinc-500 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-2xs file:bg-zinc-200 file:text-zinc-800 cursor-pointer w-full"
                        />
                        {pax.documents?.flightTicketFileName && (
                          <span className="text-2xs font-mono text-emerald-700 block truncate">
                            ✓ {pax.documents.flightTicketFileName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                data-testid={`btn-wizard-next-${currentStep}`}
                onClick={() => {
                  if (currentStep === 1 && (!firstName.trim() || !lastName.trim())) {
                    setError('Por favor ingresa tu nombre y apellido para continuar.');
                    return;
                  }
                  setError(null);
                  setCurrentStep((prev) => prev + 1);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 duration-150"
              >
                <span>Siguiente Paso</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="btn-submit-self-registration"
                className="px-5 py-2.5 text-xs font-black text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 duration-150 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-zinc-950" />
                <span>{isSubmitting ? 'Enviando Registro...' : 'Enviar y Confirmar Registro'}</span>
              </button>
            )}
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-3xl mx-auto text-center text-xs text-zinc-400">
        Medical Trip Colombia S.A.S. · Privacidad y Protección de Datos Médicos (PHI / HIPAA) Cumplida
      </footer>
    </div>
  );
};

export default PatientSelfRegistrationView;
