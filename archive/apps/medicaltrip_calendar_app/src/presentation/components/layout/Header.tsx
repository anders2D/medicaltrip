import React from 'react';
import {
  ARCHETYPE_METADATA_LIST,
  ArchetypeMetadata,
} from '../../../infrastructure/archetypes/ArchetypeRegistry';

export interface HeaderProps {
  activeArchetypeId: string;
  onSelectArchetype: (archetypeId: string) => void;
  onOpenArchetypeModal: () => void;
  onOpenSwarmDrawer: () => void;
  onOpenDailyReportModal?: () => void;
  onOpenSettlementSheetModal?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeArchetypeId,
  onSelectArchetype,
  onOpenArchetypeModal,
  onOpenSwarmDrawer,
  onOpenDailyReportModal,
  onOpenSettlementSheetModal,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header
      className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex-shrink-0 z-30"
      data-testid="app-header"
    >
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 font-bold text-white shadow-sm">
          🏥
        </div>
        <div>
          <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <span>Medical Trip Colombia</span>
            <span className="rounded bg-sky-100 px-1.5 py-0.2 text-[10px] font-extrabold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              PWA
            </span>
          </h1>
        </div>
      </div>

      {/* Center: 4 Drive Archetypes Quick Switcher Pills */}
      <div
        className="hidden md:flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-800/80"
        data-testid="archetype-switcher-bar"
      >
        {ARCHETYPE_METADATA_LIST.map((meta: ArchetypeMetadata) => {
          const isActive = activeArchetypeId.toLowerCase().includes(meta.id.toLowerCase());
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => onSelectArchetype(meta.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-sky-700 shadow-sm dark:bg-zinc-900 dark:text-sky-300'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
              data-testid={`archetype-pill-${meta.id}`}
              title={meta.description}
            >
              <span>🇨🇼</span>
              <span>{meta.code}</span>
              <span className="text-[10px] opacity-75 font-normal">({meta.paxCount}p)</span>
            </button>
          );
        })}
      </div>

      {/* Right: Offline Indicator + Swarm Badge + Theme Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Offline Badge */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
          title="Aplicación 100% Funcional sin Conexión a Internet"
          data-testid="offline-status-badge"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>100% Offline</span>
        </span>

        {/* Daily Report Trigger (Mobile & Desktop) */}
        {onOpenDailyReportModal && (
          <button
            type="button"
            onClick={onOpenDailyReportModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 active:scale-95 transition-all"
            title="Registrar Reporte Diario ACP (Atajo: R)"
            data-testid="header-daily-report-btn"
          >
            <span>📝</span>
            <span className="hidden sm:inline">Reporte</span>
          </button>
        )}

        {/* Settlement Sheet Trigger (Mobile & Desktop) */}
        {onOpenSettlementSheetModal && (
          <button
            type="button"
            onClick={onOpenSettlementSheetModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 active:scale-95 transition-all"
            title="Ver Sábana de Liquidación ACP (Atajo: L)"
            data-testid="header-settlement-sheet-btn"
          >
            <span>📊</span>
            <span className="hidden sm:inline">Sábana</span>
          </button>
        )}

        {/* Multi-Agent Swarm Button */}
        <button
          type="button"
          onClick={onOpenSwarmDrawer}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 active:scale-95 transition-all"
          title="Ver estado de subagentes [DRV], [GUIA], [NURSE], [FIN]"
          data-testid="swarm-drawer-btn"
        >
          <span>🤖</span>
          <span className="hidden md:inline">Swarm Bus</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="rounded-lg border border-zinc-200 p-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 active:scale-95 transition-all"
          title="Conmutar Modo Claro / Oscuro"
          data-testid="theme-toggle-btn"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        {/* Archetype Selector Modal Trigger */}
        <button
          type="button"
          onClick={onOpenArchetypeModal}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 active:scale-95 transition-all"
          title="Catálogo de los 4 Casos de Drive"
          data-testid="open-archetypes-modal-btn"
        >
          📁 Casos
        </button>
      </div>
    </header>
  );
};
