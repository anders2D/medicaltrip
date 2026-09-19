/**
 * Medical Trip Colombia S.A.S. - PatientCompanionSection
 * Perfil y asignación del Acompañante Bilingüe en terreno:
 * - Acompañante asignada: Yenny Roberto (o guía asignado)
 * - Idiomas hablados (Papiamento, Español, Inglés, Nederlands)
 * - Cobertura y disponibilidad para la agenda médica
 * - Contacto directo vía WhatsApp y llamada telefónica
 * - CERO tarifas por hora ($15.500/h) en el DOM
 * - CERO subsidios de alimentación ($8k, $25k, $35k, $45k) en el DOM
 * - CERO auxilio de preparación en el DOM
 */

import React from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { UserCheck, MessageCircle, Phone, Globe, HeartHandshake, CheckCircle2, Clock } from 'lucide-react';

export const PatientCompanionSection: React.FC = () => {
  const { shifts } = useAppContext();

  // Assigned companion information
  const assignedGuideName = shifts[0]?.guideName || 'Yenny Roberto';
  const guidePhone = '+57 300 123 4567';

  const languages = [
    { code: 'pap', label: 'Papiamento', level: 'Nativo' },
    { code: 'es', label: 'Español', level: 'Nativo / Fluido' },
    { code: 'en', label: 'English', level: 'Avanzado' },
    { code: 'nl', label: 'Nederlands', level: 'Profesional' },
  ];

  const services = [
    'Acompañamiento presencial a todas las consultas con especialistas y laboratorios',
    'Traducción e intermediación cultural continua entre paciente y médicos',
    'Apoyo en la farmacia para entrega y explicación de fórmulas médicas',
    'Orientación permanente en la ciudad y asistencia en desplazamientos',
  ];

  return (
    <section data-testid="patient-companion-section" className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Acompañante Bilingüe & Asistente Personal</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Personal especializado para guiarlo, asistirlo y brindarle traducción en cada cita clínica
            </p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Asignada y Confirmada
          </span>
        </div>

        {/* Profile Card */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Avatar & Basic Info */}
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/70 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xl mb-3 shadow-2xs">
              YR
            </div>
            <h3 className="text-sm font-bold text-zinc-950">{assignedGuideName}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Acompañante Bilingüe Oficial
            </p>
            <span className="mt-2 text-[10px] font-mono font-semibold px-2 py-0.5 bg-white border border-zinc-200 rounded-full text-zinc-600">
              Certificación Médica MT
            </span>

            {/* Direct Contact Actions */}
            <div className="w-full space-y-2 mt-4 pt-3 border-t border-zinc-200/60">
              <a
                href={`https://wa.me/573001234567?text=${encodeURIComponent(
                  `Hola Yenny, soy el paciente asignado con Medical Trip Colombia. Me gustaría coordinar los detalles de mi acompañamiento.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="btn-companion-whatsapp"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer min-h-[40px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp de {assignedGuideName.split(' ')[0]}</span>
              </a>

              <a
                href={`tel:${guidePhone.replace(/\s+/g, '')}`}
                data-testid="btn-companion-phone"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-zinc-100 active:scale-95 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-200 transition-all cursor-pointer min-h-[36px]"
              >
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-mono tabular-nums">{guidePhone}</span>
              </a>
            </div>
          </div>

          {/* Languages & Coverage */}
          <div className="md:col-span-2 space-y-4">
            {/* Spoken Languages */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/70">
              <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-600" />
                <span>Idiomas de Acompañamiento & Traducción</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {languages.map((lang) => (
                  <div key={lang.code} className="p-2 bg-white rounded-lg border border-zinc-200/70 text-center">
                    <p className="text-xs font-bold text-zinc-900">{lang.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{lang.level}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scope of Support */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/70">
              <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-zinc-600" />
                <span>Alcance de su Acompañamiento en Medellín</span>
              </h4>
              <ul className="space-y-2 text-xs text-zinc-700">
                {services.map((srv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{srv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Availability Notice */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-900">Disponibilidad en Citas: </span>
                <span className="text-[11px] text-amber-800 leading-relaxed">
                  Su acompañante estará presente con antelación en el lobby de su hotel para acompañarlo en cada traslado clínico según los horarios de su itinerario.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
