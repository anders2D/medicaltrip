/**
 * Medical Trip Colombia S.A.S. - PatientSidebar
 * Menú lateral izquierdo minimalista estilo Linear:
 * - Selección de paciente en 1 solo clic.
 * - Tarjeta vertical de liquidación financiera del paciente activo.
 * - Modo colapsable (240px completo / 64px compacto de solo iconos).
 */

import React, { useState } from 'react';
import { useArchetypes } from '../../hooks/useArchetypes';
import { useAppContext } from '../../state/AppContext';
import { useAuth } from '../../state/AuthContext';
import {
  Users,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Check,
  Link2,
} from 'lucide-react';

interface PatientSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onOpenSignatureModal?: () => void;
  onOpenOcrModal?: () => void;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { archetypesList, activeArchetypeId, switchArchetype } = useArchetypes();
  const { openNewPatientModal } = useAppContext();
  const { isAdmin } = useAuth();

  const handleCopySelfRegLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?autogestion=true`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };


  const isCollapsed =
    controlledIsOpen !== undefined ? !controlledIsOpen : internalCollapsed;

  const handleToggle = () => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  return (
    <aside
      aria-label="Panel lateral de pacientes y liquidación"
      data-testid="patient-sidebar"
      className={`hidden md:flex flex-col bg-white border-r border-zinc-200 transition-all duration-200 select-none shrink-0 z-30 ${
        isCollapsed ? 'w-16' : 'w-60 lg:w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-12 px-3 border-b border-zinc-200 flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider truncate">
              Pacientes ({archetypesList.length})
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
        )}

        <div className="flex items-center gap-1">
          {!isCollapsed && isAdmin && (
            <>
              <button
                type="button"
                onClick={handleCopySelfRegLink}
                data-testid="btn-sidebar-copy-selfreg"
                title={copiedLink ? '¡Enlace de autogestión copiado!' : 'Copiar enlace de autogestión para WhatsApp'}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={openNewPatientModal}
                data-testid="btn-sidebar-new-patient"
                title="Crear nuevo paciente [N]"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleToggle}
            data-testid="btn-toggle-sidebar"
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Patient List (1-Click Switcher) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {archetypesList.map((archetype, idx) => {
          const isActive = archetype.id === activeArchetypeId;
          const shortcutNum = idx + 1;
          const firstName = archetype.patientName.split(' ')[0];

          return (
            <button
              key={archetype.id}
              type="button"
              onClick={() => switchArchetype(archetype.id)}
              data-testid={`sidebar-switcher-${archetype.id}`}
              title={`${archetype.patientName} (${archetype.code}) - ${archetype.hotelName} [${shortcutNum}]`}
              className={`w-full text-left rounded-lg transition-all duration-150 cursor-pointer flex items-center ${
                isCollapsed
                  ? 'justify-center p-2'
                  : 'justify-between px-2.5 py-2 gap-2'
              } ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="text-base leading-none shrink-0"
                  role="img"
                  aria-label={archetype.country}
                >
                  {archetype.countryFlag}
                </span>

                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-white' : 'text-zinc-900'
                        }`}
                      >
                        {firstName}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1 rounded uppercase ${
                          isActive
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'bg-zinc-200/70 text-zinc-600'
                        }`}
                      >
                        {archetype.code}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] truncate ${
                        isActive ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      {archetype.hotelName.replace('Hotel ', '')} &bull;{' '}
                      {archetype.paxCount} Pax
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex items-center gap-1 shrink-0">
                  {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      isActive
                        ? 'text-zinc-400 bg-zinc-800'
                        : 'text-zinc-400 bg-zinc-100'
                    }`}
                  >
                    {shortcutNum}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

