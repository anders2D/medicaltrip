/**
 * Medical Trip Colombia S.A.S. - ArchetypeSwitcherBar
 * Admin Cockpit Switcher & Persistent Status Pill (R1)
 *
 * Minimalist, high-density operational cockpit:
 * - Brand Logo & diagnostic trigger.
 * - Persistent Status Pill [🇨🇼 Natalie Monica Bito · RVA350 | Glaucornea · 2 Pax ▾] visible on ALL viewports.
 * - Instant Dropdown Cockpit with keyboard shortcuts [1]-[5], hotel stays, and quick actions.
 * - 7-layer safety keyboard listener via useKeyboardShortcuts hook.
 * - User Session & Role badge with clean Logout.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useArchetypes } from '../../hooks/useArchetypes';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAppContext } from '../../state/AppContext';
import { useAuth } from '../../state/AuthContext';
import {
  UserPlus,
  LogOut,
  UserCheck,
  ChevronDown,
  Check,
  Link2,
  ShieldCheck,
  PenTool,
  Hotel,
} from 'lucide-react';

/**
 * Resolves the primary clinical or diagnostic provider for an archetype or booking.
 */
export function resolvePrimaryClinic(archetypeId?: string, bookingNotes?: string): string {
  if (archetypeId === 'rva350') return 'Glaucornea';
  if (archetypeId === 'rva171') return 'CIMA';
  if (archetypeId === 'rva282') return 'Cardio VID';
  if (archetypeId === 'rva341') return 'Clínica CES';
  if (archetypeId === 'rva077') return 'HPTU';
  if (bookingNotes) {
    if (bookingNotes.includes('Glaucornea')) return 'Glaucornea';
    if (bookingNotes.includes('Clofán')) return 'Clofán';
    if (bookingNotes.includes('CIMA')) return 'CIMA';
    if (bookingNotes.includes('Cardio')) return 'Cardio VID';
    if (bookingNotes.includes('CES')) return 'CES';
    if (bookingNotes.includes('HPTU')) return 'HPTU';
  }
  return 'Glaucornea';
}

/**
 * Resolves lodging status and room number for an archetype or booking.
 */
export function resolveLodgingStatus(archetypeId?: string, hotelName?: string): string {
  if (archetypeId === 'rva350') return 'Hotel 1616 · 16 Noches (2 Pax)';
  if (archetypeId === 'rva171') return 'Hotel Inntu · Hab 302 (5 Pax)';
  if (archetypeId === 'rva282') return 'Park 42 · Apto 504 (32 días)';
  if (archetypeId === 'rva341') return 'Hotel Inntu · Hab 1004 (2 Pax)';
  if (archetypeId === 'rva077') return 'Novelty Suites · Hab 408 (12 días)';
  if (hotelName) return `${hotelName} · Reserva Activa`;
  return 'Hospedaje Coordinado';
}

export const ArchetypeSwitcherBar: React.FC = () => {
  const { archetypesList, activeArchetypeId, activeArchetype, activeBooking, switchArchetype } =
    useArchetypes();
  const {
    openNewPatientModal,
    openSendInvitationModal,
    openCompanionTurnModal,
    openSwarmDiagnosticsModal,
  } = useAppContext();
  const { user, isAdmin, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Wire 7-layer safety keyboard shortcuts [1]-[5]
  useKeyboardShortcuts({
    enabled: isAdmin,
    onSwitchArchetype: (id) => {
      switchArchetype(id);
      setIsDropdownOpen(false);
    },
    archetypesList,
  });

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const activeBookingName = activeBooking
    ? `${activeBooking.firstName} ${activeBooking.lastName}`.trim()
    : '';
  const patientDisplayName =
    activeBookingName || activeArchetype?.patientName || 'Natalie Monica Bito e/v Rumai';
  const reservationCode =
    activeBooking?.code?.split('-')[0] || activeArchetype?.code?.split('-')[0] || 'RVA350';
  const clinicTag = resolvePrimaryClinic(
    activeArchetype?.id,
    activeBooking?.notes || activeArchetype?.description
  );
  const paxCount = activeBooking?.paxCount || activeArchetype?.paxCount || 2;

  return (
    <header className="w-full bg-white border-b border-zinc-200 select-none relative z-40">
      {/* Top Header Row - Crisp Single Row with High Touch Comfort */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            onDoubleClick={openSwarmDiagnosticsModal}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 cursor-default shadow-xs"
            title="Medical Trip Colombia (Doble clic para diagnóstico)"
          >
            MT
          </div>
          <div className="flex flex-col hidden sm:flex">
            <h1 className="text-sm font-bold text-zinc-950 leading-tight whitespace-nowrap">
              Medical Trip Colombia
            </h1>
            <span className="text-[10px] text-zinc-500 font-medium">
              Operaciones & Liquidación
            </span>
          </div>
          <span className="sr-only">100% Offline · Itinerarios & Liquidación Determinista</span>
        </div>

        {/* Center: Dropdown Patient Selector & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
          {/* Dropdown Container */}
          <div ref={dropdownRef} className="relative shrink-0">
            {/* Active Patient Persistent Status Pill (Prominent, High Touch Target) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen((prev) => !prev);
              }}
              data-testid="patient-dropdown-trigger"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              title={`Cambiar paciente activo (${patientDisplayName})`}
              className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-zinc-50/90 hover:bg-zinc-100/90 text-zinc-900 text-sm font-medium transition-all duration-150 cursor-pointer min-h-[44px] shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 shrink-0"
            >
              {/* Country Badge */}
              <span className="text-[11px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 shrink-0">
                {activeArchetype?.countryCode || 'CW'}
              </span>

              {/* Active Patient Name */}
              <span className="font-bold text-zinc-950 text-xs sm:text-sm truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-none">
                {patientDisplayName}
              </span>

              {/* Separator Dot */}
              <span className="text-zinc-400 select-none">·</span>

              {/* Reservation Code Badge */}
              <span className="text-xs font-mono tabular-nums uppercase px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 font-bold tracking-wide shrink-0">
                {reservationCode}
              </span>

              {/* Pipe Divider */}
              <span className="text-zinc-300 select-none font-light hidden xs:inline sm:inline">|</span>

              {/* Assigned Clinic */}
              <span className="font-semibold text-zinc-700 text-xs sm:text-sm truncate max-w-[90px] sm:max-w-[120px] md:max-w-none hidden xs:inline sm:inline">
                {clinicTag}
              </span>

              {/* Secondary Dot */}
              <span className="text-zinc-400 select-none hidden xs:inline sm:inline">·</span>

              {/* Pax Count */}
              <span className="font-mono tabular-nums text-xs text-zinc-600 font-semibold shrink-0 hidden xs:inline sm:inline">
                {paxCount} Pax
              </span>

              {/* Animated Chevron */}
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ml-0.5 ${
                  isDropdownOpen ? 'rotate-180 text-zinc-900' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Popup (Unclipped, Crisp z-50) */}
            {isDropdownOpen && (
              <div
                className="fixed inset-x-3 top-16 sm:absolute sm:top-full sm:left-0 sm:inset-x-auto mt-2 z-50 flex flex-col max-h-[85vh] overflow-y-auto bg-white border border-zinc-200 ring-1 ring-zinc-950/10 rounded-2xl shadow-2xl p-3 min-w-[320px] sm:min-w-[380px] md:min-w-[440px] gap-2.5 animate-in fade-in-50 zoom-in-95 duration-100"
              >
                {/* Dropdown Header with Actions */}
                <div className="border-b border-zinc-100 pb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Pacientes en Terreno
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">
                      Atajos [1-5]
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDropdownOpen(false);
                          openNewPatientModal();
                        }}
                        data-testid="btn-dropdown-new-patient"
                        title="Crear nueva reserva de paciente desde cero [N]"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Nuevo</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDropdownOpen(false);
                          openSendInvitationModal();
                        }}
                        data-testid="btn-dropdown-send-link"
                        title="Generar y enviar enlace de autogestión WhatsApp"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                      >
                        <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Link</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Active Archetype Lodging Summary Banner */}
                <div className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Hotel className="w-4 h-4 text-zinc-600 shrink-0" />
                    <span className="text-xs text-zinc-800 font-medium truncate">
                      {resolveLodgingStatus(activeArchetype?.id, activeArchetype?.hotelName)}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                    Activo
                  </span>
                </div>

                {/* Caribbean Archetype List */}
                <div className="space-y-1.5">
                  {archetypesList.map((archetype, idx) => {
                    const isActive = archetype.id === activeArchetypeId;
                    const shortcutNum = idx + 1;
                    const clinic = resolvePrimaryClinic(archetype.id, archetype.description);
                    const lodging = resolveLodgingStatus(archetype.id, archetype.hotelName);

                    return (
                      <button
                        key={archetype.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          switchArchetype(archetype.id);
                          setIsDropdownOpen(false);
                        }}
                        data-testid={`switcher-${archetype.id}`}
                        aria-keyshortcuts={String(shortcutNum)}
                        title={`${archetype.patientName} (${archetype.code}) - ${clinic}, ${lodging} [${shortcutNum}]`}
                        className={`relative w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer shrink-0 touch-manipulation min-h-[48px] active:scale-[0.98] ${
                          isActive
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                            : 'bg-zinc-50/70 hover:bg-zinc-100 text-zinc-800 border-zinc-200/60 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`text-xs font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                              isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'
                            }`}
                          >
                            {archetype.countryCode || 'CW'}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                                  isActive ? 'text-white' : 'text-zinc-950'
                                }`}
                              >
                                {archetype.patientName}
                              </span>
                              <span
                                className={`text-[11px] font-mono tabular-nums uppercase px-1.5 py-0.5 rounded font-bold ${
                                  isActive
                                    ? 'bg-zinc-800 text-zinc-300'
                                    : 'bg-zinc-200 text-zinc-800'
                                }`}
                              >
                                {archetype.code}
                              </span>
                              <span
                                className={`text-[11px] font-medium px-1.5 py-0.5 rounded truncate ${
                                  isActive
                                    ? 'bg-zinc-800/80 text-zinc-200'
                                    : 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {clinic}
                              </span>
                            </div>

                            {/* Lodging & Pax Count Status */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <Hotel
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isActive ? 'text-zinc-400' : 'text-zinc-500'
                                }`}
                              />
                              <span
                                className={`text-xs truncate ${
                                  isActive ? 'text-zinc-300' : 'text-zinc-600'
                                }`}
                              >
                                {lodging} &bull;{' '}
                                <span className="font-mono tabular-nums font-semibold">
                                  {archetype.paxCount} Pax
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <kbd
                            className={`px-2 py-1 text-[11px] font-mono tabular-nums font-semibold rounded-md border transition-colors ${
                              isActive
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                : 'bg-white border-zinc-200 text-zinc-600 shadow-2xs'
                            }`}
                          >
                            [{shortcutNum}]
                          </kbd>
                          {isActive && (
                            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons (Desktop Top Bar) */}
          {isAdmin ? (
            <>
              {/* + Nuevo Paciente Button (Desktop) */}
              <button
                type="button"
                onClick={openNewPatientModal}
                data-testid="btn-header-new-patient"
                title="Crear nueva reserva de paciente desde cero [N]"
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-zinc-300 hover:border-zinc-500 bg-white hover:bg-zinc-50 text-zinc-800 text-sm font-semibold transition-all shrink-0 cursor-pointer min-h-[44px] touch-manipulation active:scale-95 duration-150 shadow-2xs"
              >
                <UserPlus className="w-4 h-4 text-zinc-600" />
                <span>Nuevo Paciente</span>
              </button>

              {/* 🔗 Enviar Link a Paciente (Autogestión) (Desktop) */}
              <button
                type="button"
                onClick={openSendInvitationModal}
                data-testid="btn-header-send-link"
                title="Generar y enviar enlace de autogestión al paciente vía WhatsApp"
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-300 hover:border-emerald-500 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-900 text-sm font-semibold transition-all shrink-0 cursor-pointer min-h-[44px] touch-manipulation active:scale-95 duration-150 shadow-2xs"
              >
                <Link2 className="w-4 h-4 text-emerald-700" />
                <span>Enviar Link</span>
              </button>
            </>
          ) : (
            /* ROL ACOMPAÑANTE FÍSICO: Acceso directo a planilla de turno */
            <button
              type="button"
              onClick={openCompanionTurnModal}
              data-testid="btn-header-companion-turn"
              title="Abrir planilla de acompañamiento físico, horas y gastos"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 text-sm font-semibold transition-all shrink-0 cursor-pointer min-h-[44px] touch-manipulation active:scale-95 duration-150 shadow-2xs"
            >
              <PenTool className="w-4 h-4 text-amber-700" />
              <span>Planilla de Turno</span>
            </button>
          )}
        </div>

        {/* Right: User Session & Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* User Profile Badge */}
          <div
            data-testid="user-role-badge"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium ${
              isAdmin
                ? 'bg-zinc-100 border-zinc-200 text-zinc-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-zinc-700" />
            ) : (
              <UserCheck className="w-4 h-4 text-amber-700" />
            )}
            <span className="font-bold text-zinc-950 truncate max-w-[120px] hidden sm:inline">
              {user?.name?.split(' ')[0] || user?.username || 'Usuario'}
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                isAdmin ? 'bg-zinc-900 text-white' : 'bg-amber-200 text-amber-950'
              }`}
            >
              {isAdmin ? 'Admin' : 'Guía'}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            data-testid="btn-logout"
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-zinc-600 text-xs sm:text-sm font-medium transition-colors cursor-pointer min-h-[40px]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ArchetypeSwitcherBar;
