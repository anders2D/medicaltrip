import React from 'react';
import { CalendarViewMode } from '../../hooks/useItinerary';

export interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  searchQuery: string;
  categoryFilter: string | null;
  statusFilter: string | null;
  onViewChange: (view: CalendarViewMode) => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
  onSearchChange: (query: string) => void;
  onCategoryFilterChange: (cat: string | null) => void;
  onStatusFilterChange: (status: string | null) => void;
  onNewEvent: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  searchQuery,
  categoryFilter,
  statusFilter,
  onViewChange,
  onPrevDate,
  onNextDate,
  onToday,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onNewEvent,
}) => {
  const monthYearLabel = currentDate.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="calendar-header"
    >
      {/* Left: Date Navigation + Today + Month Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToday}
          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          data-testid="calendar-today-btn"
        >
          Hoy
        </button>

        <div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={onPrevDate}
            className="px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            data-testid="calendar-prev-btn"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNextDate}
            className="border-l border-zinc-200 px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            data-testid="calendar-next-btn"
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>

        <h2 className="text-base font-bold capitalize text-zinc-900 dark:text-zinc-100 tracking-tight min-w-[140px]">
          {monthYearLabel}
        </h2>
      </div>

      {/* Center: Search & Filters */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-zinc-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por clínica, doctor, procedimiento..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 pl-8 pr-7 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-900"
            data-testid="calendar-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400 hover:text-zinc-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={categoryFilter || ''}
          onChange={(e) => onCategoryFilterChange(e.target.value || null)}
          className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          data-testid="calendar-category-filter"
        >
          <option value="">Todas las Categorías</option>
          <option value="FLIGHT">✈️ Vuelos / Traslados</option>
          <option value="CLINICAL">🏥 Citas Clínicas</option>
          <option value="LAB">🔬 Laboratorios</option>
          <option value="PHARMACY">💊 Farmacia / Gastos</option>
          <option value="HOTEL">🏨 Hotel / Reposo</option>
        </select>
      </div>

      {/* Right: View Switcher & New Event Button */}
      <div className="flex items-center gap-2.5">
        <div
          className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-800/80"
          role="tablist"
        >
          {(['day', 'week', 'month', 'agenda'] as CalendarViewMode[]).map((v) => {
            const labels: Record<CalendarViewMode, string> = {
              day: 'Día',
              week: 'Semana',
              month: 'Mes',
              agenda: 'Agenda',
            };
            const isActive = viewMode === v;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onViewChange(v)}
                data-testid={`view-mode-${v}`}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-sky-700 shadow-sm dark:bg-zinc-900 dark:text-sky-400'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {labels[v]}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNewEvent}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-colors"
          data-testid="calendar-new-event-btn"
        >
          <span>＋</span>
          <span>Nueva Cita</span>
        </button>
      </div>
    </div>
  );
};
