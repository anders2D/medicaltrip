/**
 * Medical Trip Colombia S.A.S. - UsersView (Directorio Operativo de Personal)
 * Directorio puro de personal en terreno, logística y coordinación médica.
 * Cumple con Alternativa 10 (Minimalismo Funcional Radical) y Cero Conmutación de Roles.
 */

import React from 'react';
import { useAuth } from '@/core/auth';
import { useAppContext } from '@/presentation/state/AppContext';
import {
  Users,
  MessageSquare,
  Lock,
  LogOut,
  MapPin,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeBooking } = useAppContext();

  const staffMembers = [
    {
      name: 'Carolina Cortázar',
      roleCode: 'ADMIN',
      roleTitle: 'Administrador General & Coordinación Médica',
      dutyBadge: 'En Sede Administrativa · Activa',
      dutyVariant: 'emerald' as const,
      phone: '+57 300 123 4567',
      whatsapp: `https://wa.me/573001234567?text=${encodeURIComponent('Hola Carolina, solicito coordinación operativa médica.')}`,
      location: 'Sede Administrativa Medellín · El Poblado',
      assignedCase: 'Supervisión Global de Casos Caribe',
      responsibilities: [
        'Creación de pacientes y reservas desde cero',
        'Asignación de presupuestos y anticipos Bancolombia',
        'Auditoría y cierre contable de cuentas de cobro',
      ],
      avatar: 'CC',
      avatarBg: 'bg-zinc-950 text-white',
    },
    {
      name: 'Yenny Roberto',
      roleCode: 'COMPANION',
      roleTitle: 'Acompañante Físico Bilingüe (Persona en Sitio)',
      dutyBadge: activeBooking
        ? `En Turno Activo · Con ${activeBooking.firstName}`
        : 'En Turno Activo',
      dutyVariant: 'amber' as const,
      phone: '+57 311 987 6543',
      whatsapp: `https://wa.me/573119876543?text=${encodeURIComponent(
        `Hola Yenny, requiero reporte de terreno del paciente ${activeBooking?.firstName || 'actual'}.`
      )}`,
      location: 'Consultorio Dr. Lukas Saldarriaga / Glaucornea / Hotel 1616',
      assignedCase: activeBooking
        ? `${activeBooking.firstName} ${activeBooking.lastName} (${activeBooking.code})`
        : 'Natalie Monica Bito e/v Rumai (RVA350-1)',
      responsibilities: [
        'Acompañamiento físico y guianza presencial 1 a 1',
        'Traducción Papiamento / Neerlandés / Inglés',
        'Registro de horas laboradas ($15.500/h) y caja menor',
      ],
      avatar: 'YR',
      avatarBg: 'bg-amber-500 text-white',
    },
    {
      name: 'Ramón Rosero',
      roleCode: 'DRIVER',
      roleTitle: 'Conductor Principal de Flota (Aeroturex)',
      dutyBadge: 'En Ruta (JMC ↔ Medellín)',
      dutyVariant: 'sky' as const,
      phone: '+57 320 555 7890',
      whatsapp: `https://wa.me/573205557890?text=${encodeURIComponent('Hola Ramón, coordinación de traslado de paciente.')}`,
      location: 'Aeroturex Sedán · Placa ABC-123',
      assignedCase: activeBooking
        ? `Traslados aeropuerto y clínicas: ${activeBooking.firstName}`
        : 'Ruta Aeropuerto JMC',
      responsibilities: [
        'Recepción internacional con letrero en JMC',
        'Traslados entre hotel, clínicas y aeropuerto',
        'Comprobantes de peajes y combustible',
      ],
      avatar: 'RR',
      avatarBg: 'bg-sky-600 text-white',
    },
    {
      name: 'Dra. Jenny Paola Acosta',
      roleCode: 'MED_DIR',
      roleTitle: 'Dirección Médica & Calidad Asistencial',
      dutyBadge: 'En Clínica CIMA',
      dutyVariant: 'purple' as const,
      phone: '+57 301 444 1122',
      whatsapp: `https://wa.me/573014441122?text=${encodeURIComponent('Dra. Acosta, consulta sobre evolución médica de paciente.')}`,
      location: 'Clínica CIMA / Consultorio 402',
      assignedCase: 'Auditoría Clínica Internacional & Fit-to-Fly',
      responsibilities: [
        'Auditoría de historias clínicas internacionales',
        'Emisión de certificados digitales Fit-to-Fly',
        'Supervisión de enfermería postquirúrgica',
      ],
      avatar: 'JA',
      avatarBg: 'bg-purple-600 text-white',
    },
  ];

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 select-none pb-32 space-y-5">
      {/* 1. CLEAN DIRECTORY HEADER (Zero Role Switches) */}
      <header className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-950">
              Directorio Operativo de Personal
            </h2>
            <p className="text-xs text-zinc-500">
              Personal activo de Medical Trip Colombia S.A.S. para coordinación médica, guianza y traslados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200/70">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            4 Colaboradores Activos
          </span>
        </div>
      </header>

      {/* 2. OPERATIVE STAFF BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staffMembers.map((member) => (
          <div
            key={member.name}
            className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-300 transition-all shadow-xs space-y-3"
          >
            {/* Staff Card Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${member.avatarBg}`}>
                  {member.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 leading-tight">
                    {member.name}
                  </h3>
                  <span className="text-[11px] text-zinc-500 block font-medium">
                    {member.roleTitle}
                  </span>
                </div>
              </div>

              {/* Duty Badge */}
              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 border ${
                  member.dutyVariant === 'emerald'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                    : member.dutyVariant === 'amber'
                    ? 'bg-amber-50 text-amber-900 border-amber-200/70'
                    : member.dutyVariant === 'sky'
                    ? 'bg-sky-50 text-sky-800 border-sky-200/70'
                    : 'bg-purple-50 text-purple-800 border-purple-200/70'
                }`}
              >
                {member.dutyBadge}
              </span>
            </div>

            {/* Location & Assigned Case Meta */}
            <div className="text-[11px] text-zinc-600 space-y-1.5 border-t border-zinc-100 pt-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-500">Ubicación:</span>
                <span className="font-medium text-zinc-900 truncate">{member.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-500">Caso Asignado:</span>
                <span className="font-semibold text-zinc-950 truncate">{member.assignedCase}</span>
              </div>
            </div>

            {/* Direct WhatsApp Contact Trigger */}
            <div className="pt-1">
              <a
                href={member.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                title={`Enviar WhatsApp a ${member.name}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all cursor-pointer min-h-[38px] active:scale-98"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Contactar por WhatsApp ({member.phone})</span>
              </a>
            </div>

            {/* Key Responsibilities */}
            <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-1">
                Funciones Operativas:
              </span>
              <ul className="text-[11px] text-zinc-600 space-y-1">
                {member.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* 3. SESSION FOOTER */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Sesión activa de {user?.name || 'Carolina Cortázar'} · Almacenamiento local determinista (100% Offline).</span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 hover:border-red-200 bg-white hover:bg-red-50 text-zinc-700 hover:text-red-700 text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
