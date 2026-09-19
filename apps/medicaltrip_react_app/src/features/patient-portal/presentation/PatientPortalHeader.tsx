/**
 * Medical Trip Colombia S.A.S. - PatientPortalHeader
 * Cabecera institucional ultra-limpia para el Portal del Paciente Internacional:
 * - Logo MT sin diagnósticos ocultos de desarrollador
 * - Badge del paciente (Nombre, bandera de nacionalidad, código de reserva)
 * - Chip de doble zona horaria (COT / AST) en tabular-nums font-mono
 * - Selector de idiomas (es, en, nl, pap)
 * - CTA directo de WhatsApp con la coordinadora Carolina Cortázar
 * - Botón de cierre de sesión
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import { MessageCircle, LogOut, Globe, Clock } from 'lucide-react';

export interface PatientPortalHeaderProps {
  onOpenSatisfactionModal?: () => void;
}

export const PatientPortalHeader: React.FC<PatientPortalHeaderProps> = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Dual timezone live clock (COT: UTC-5, AST: UTC-4)
  const [timeCOT, setTimeCOT] = useState<string>('');
  const [timeAST, setTimeAST] = useState<string>('');

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setTimeCOT(
        now.toLocaleTimeString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
      setTimeAST(
        now.toLocaleTimeString('en-US', {
          timeZone: 'America/Curacao',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };

    updateClocks();
    const interval = setInterval(updateClocks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine nationality country code & label from booking/user data
  const getCountryBadge = () => {
    const code = (user?.bookingCode || user?.bookingId || '').toUpperCase();
    const username = (user?.username || '').toLowerCase();
    const name = (user?.name || '').toLowerCase();

    if (code.includes('RVA282') || username.includes('george') || name.includes('george')) {
      return { code: 'CW / US', country: 'Curazao / EE.UU.' };
    }
    if (code.includes('RVA341') || username.includes('eduard') || name.includes('eduard')) {
      return { code: 'CW / NL', country: 'Curazao / Países Bajos' };
    }
    if (code.includes('RVA350') || username.includes('natalie') || name.includes('natalie')) {
      return { code: 'CW', country: 'Curazao / Bonaire' };
    }
    return { code: 'CW', country: 'Curazao' };
  };

  const territory = getCountryBadge();

  return (
    <header
      data-testid="patient-portal-header"
      className="px-4 sm:px-6 py-3.5 bg-white border-b border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 select-none"
    >
      {/* 1. Branding & Logo */}
      <div className="flex items-center gap-3">
        <div
          data-testid="patient-portal-logo"
          className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-sm tracking-wider ring-1 ring-black/5"
          title="Medical Trip Colombia S.A.S."
        >
          MT
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-zinc-950 tracking-tight">
              Medical Trip Colombia
            </h1>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full font-mono">
              Portal Paciente
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Portal del Paciente Internacional • Medellín & Eje Médico
          </p>
        </div>
      </div>

      {/* 2. Patient Badge */}
      <div
        data-testid="patient-badge-card"
        className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200/70 rounded-xl text-xs"
      >
        <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-mono text-[10px] font-bold uppercase">
          {territory.code}
        </span>
        <div className="flex flex-col">
          <span className="font-bold text-zinc-900 leading-tight">
            {user?.name || 'Paciente Internacional'}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            Reserva <strong className="font-semibold text-zinc-800 tabular-nums font-mono">{user?.bookingCode || user?.bookingId || 'RVA171-4'}</strong>
            {user?.patientId && (
              <> • <span className="tabular-nums font-mono text-zinc-400">{user.patientId}</span></>
            )}
          </span>
        </div>
      </div>

      {/* 3. Controls & Action Bar */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Dual Timezone Chip (COT / AST) */}
        <div
          data-testid="dual-timezone-chip"
          className="flex items-center gap-2 px-2.5 py-1 bg-zinc-100/80 border border-zinc-200/60 rounded-lg text-[11px] font-mono text-zinc-600"
          title="Horarios en tiempo real: COT (Colombia UTC-5) vs AST (Caribe UTC-4)"
        >
          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="tabular-nums font-mono">
            <strong className="text-zinc-800">COT</strong> {timeCOT || '10:30'}
          </span>
          <span className="text-zinc-300">|</span>
          <span className="tabular-nums font-mono">
            <strong className="text-zinc-800">AST</strong> {timeAST || '11:30'}
          </span>
        </div>

        {/* Multilingual Switcher (es, en, nl, pap) */}
        <div
          data-testid="patient-language-switcher"
          className="flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200/60"
        >
          <Globe className="w-3 h-3 text-zinc-400 ml-1.5 mr-0.5 shrink-0" />
          {(['es', 'en', 'nl', 'pap'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              data-testid={`btn-lang-${lang}`}
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase font-mono transition-all cursor-pointer ${
                language === lang
                  ? 'bg-white text-zinc-950 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Direct WhatsApp Coordinator CTA */}
        <a
          href={`https://wa.me/573001234567?text=${encodeURIComponent(
            `Hola Carolina, soy ${user?.name || 'paciente'} (Reserva ${user?.bookingCode || user?.bookingId || 'RVA171-4'}). Necesito asistencia con mi itinerario médico.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="btn-patient-whatsapp-coordinator"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer min-h-[34px]"
          title="Contactar a Carolina Cortázar (Coordinadora Médica)"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Carolina Cortázar</span>
          <span className="sm:hidden">Coordinadora</span>
        </a>

        {/* Logout Button */}
        <button
          type="button"
          onClick={logout}
          data-testid="btn-patient-logout"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer min-h-[34px]"
          title="Cerrar sesión"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};
