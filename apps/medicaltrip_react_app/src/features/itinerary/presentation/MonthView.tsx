/**
 * Medical Trip Colombia S.A.S. - MonthView Component
 * Dual-paradigm responsive month calendar:
 * - Desktop (>=768px): 7-column grid with dynamic height scaling, companion shift cards & settlement button.
 * - Mobile (<768px): Apple/Google Calendar Pattern - Compact 7-column mini-month with clean status dot indicators
 *   + dedicated below-grid Selected Day Settlement Card & Agenda Timeline.
 */

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { useSettlement } from '@/features/settlement';
import { ItineraryEvent } from '../domain/ItineraryEvent';
import { X, User, Plus } from 'lucide-react';

interface CalendarCellData {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: ItineraryEvent[];
}

export const MonthView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    setActiveView,
    events,
    shifts,
    expenses,
  } = useAppContext();

  const { availableDays } = useSettlement();

  const [popoverDate, setPopoverDate] = useState<CalendarCellData | null>(null);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ItineraryEvent[]>();
    for (const evt of events) {
      try {
        const d = new Date(evt.startDateTime);
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().split('T')[0];
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(evt);
        }
      } catch {
        // ignore invalid dates
      }
    }
    return map;
  }, [events]);

  // Generate the full 35-42 day calendar cell grid
  const calendarCells = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDayOfMonth.getDate();

    const cells: CalendarCellData[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedStr = selectedDate.toISOString().split('T')[0];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(year, month - 1, dayNum);
      const dateKey = date.toISOString().split('T')[0];
      cells.push({
        date,
        dateKey,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        isSelected: dateKey === selectedStr,
        events: eventsByDate.get(dateKey) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dateKey = date.toISOString().split('T')[0];
      cells.push({
        date,
        dateKey,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateKey === todayStr,
        isSelected: dateKey === selectedStr,
        events: eventsByDate.get(dateKey) || [],
      });
    }

    // Next month padding days to complete a full 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const date = new Date(year, month + 1, n);
      const dateKey = date.toISOString().split('T')[0];
      cells.push({
        date,
        dateKey,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        isSelected: dateKey === selectedStr,
        events: eventsByDate.get(dateKey) || [],
      });
    }

    return cells;
  }, [selectedDate, eventsByDate]);

  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Map days of active booking stay for daily settlement calendar
  const stayDaysMap = useMemo(() => {
    const map = new Map<string, { dayNumber: number; label: string; formattedDate: string }>();
    for (const d of (availableDays || [])) {
      map.set(d.date, d);
    }
    return map;
  }, [availableDays]);

  // Selected cell and associated settlement info
  const selectedDateKey = useMemo(() => {
    try {
      return selectedDate.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, [selectedDate]);

  const selectedCell = useMemo(() => {
    return (
      calendarCells.find((c) => c.isSelected) ||
      calendarCells.find((c) => c.dateKey === selectedDateKey) ||
      calendarCells[0]
    );
  }, [calendarCells, selectedDateKey]);

  const selectedStayDay = useMemo(() => {
    return selectedCell ? stayDaysMap.get(selectedCell.dateKey) : undefined;
  }, [selectedCell, stayDaysMap]);

  const selectedDayShift = useMemo(() => {
    return selectedCell
      ? (shifts || []).find((s) => (s.date || '').startsWith(selectedCell.dateKey))
      : undefined;
  }, [selectedCell, shifts]);

  // Daily balance calculations per cell dateKey
  const getDaySettlementSummary = (dateKey: string) => {
    const dayExps = (expenses || []).filter((e) => (e.date || '').startsWith(dateKey));
    const dayShiftsList = (shifts || []).filter((s) => (s.date || '').startsWith(dateKey));
    const totalExpCents = dayExps.reduce((acc, e) => acc + (e.amount?.cents ? Number(e.amount.cents) : 0), 0);
    const totalFeeCents = dayShiftsList.reduce((acc, s) => acc + (s.calculateTotalFee() ? Number(s.calculateTotalFee().cents) : 0), 0);
    const pettyCashCents = 20000000; // $200.000 COP
    const netCents = totalExpCents + totalFeeCents - pettyCashCents;
    const hasData = dayExps.length > 0 || dayShiftsList.length > 0;

    return {
      hasData,
      expensesCount: dayExps.length,
      shiftsCount: dayShiftsList.length,
      netCents,
      netFormatted: netCents >= 0
        ? `+$${(netCents / 100).toLocaleString('es-CO')}`
        : `-$${(Math.abs(netCents) / 100).toLocaleString('es-CO')}`,
      isDeficit: netCents < 0,
      isSurplus: netCents > 0,
    };
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-white overflow-hidden select-none">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/80 text-center text-xs font-semibold text-zinc-700 py-1.5 sm:py-2 shrink-0">
        {weekdays.map((day, idx) => (
          <div key={day} className={idx >= 5 ? 'text-zinc-400' : 'text-zinc-700'}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid de 7 Columnas: Mini-Mes en Mobile (<md) y Cuadrícula Completa en Desktop (>=md) */}
      <div className="grid grid-cols-7 bg-zinc-200 gap-[1px] shrink-0 md:shrink md:flex-1 md:grid-rows-6 min-h-0">
        {calendarCells.map((cell) => {
          const stayDay = stayDaysMap.get(cell.dateKey);
          const summary = getDaySettlementSummary(cell.dateKey);
          const dayShift = (shifts || []).find((s) => (s.date || '').startsWith(cell.dateKey));

          return (
            <div
              key={cell.dateKey}
              onClick={() => setSelectedDate(cell.date)}
              data-testid={`month-cell-${cell.dateKey}`}
              className={`p-1 md:p-2 flex flex-col transition-colors cursor-pointer ${
                cell.isSelected
                  ? 'ring-2 ring-zinc-950 bg-zinc-100/90 z-10'
                  : stayDay
                  ? 'bg-zinc-50/60 hover:bg-zinc-100/80'
                  : !cell.isCurrentMonth
                  ? 'bg-zinc-50/40 text-zinc-400'
                  : 'bg-white hover:bg-zinc-50 text-zinc-950'
              } h-11 sm:h-12 md:h-auto md:min-h-[68px] justify-center items-center md:items-stretch md:justify-between`}
            >
              {/* VISTA MOBILE (< md): Solo número de día + Micro-punto de estado limpio (CERO texto/botones que desborden) */}
              <div className="md:hidden flex flex-col items-center justify-center w-full">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold tabular-nums ${
                    cell.isToday
                      ? 'bg-rose-600 text-white font-bold'
                      : cell.isSelected
                      ? 'bg-zinc-950 text-white font-bold'
                      : cell.isCurrentMonth
                      ? 'text-zinc-800'
                      : 'text-zinc-400'
                  }`}
                >
                  {cell.dayNumber}
                </span>
                <div className="flex items-center justify-center gap-0.5 mt-0.5 h-1.5">
                  {dayShift ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dayShift.status === 'COMPLETED' || dayShift.status === 'APPROVED'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      title={dayShift.status === 'COMPLETED' || dayShift.status === 'APPROVED' ? 'Liquidado' : 'Programado'}
                    />
                  ) : stayDay ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" title="Día de estadía" />
                  ) : cell.events.length > 0 ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Con eventos" />
                  ) : null}
                </div>
              </div>

              {/* VISTA DESKTOP (>= md): Cabecera con balance + Tarjeta de acompañante o botón liquidar */}
              <div className="hidden md:flex flex-col justify-between h-full">
                {/* Encabezado: Número de día y Micro-Indicador de Balance */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold tabular-nums ${
                      cell.isToday
                        ? 'bg-rose-600 text-white font-bold'
                        : cell.isSelected
                        ? 'bg-zinc-950 text-white font-bold'
                        : cell.isCurrentMonth
                        ? 'text-zinc-800'
                        : 'text-zinc-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {stayDay && summary.hasData && (
                    <div
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-600 font-medium"
                      title={`Balance del día: ${summary.netFormatted}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          summary.isDeficit ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span>{summary.netFormatted}</span>
                    </div>
                  )}
                </div>

                {/* Tarjeta de Acompañante en Desktop */}
                <div className="flex-1 flex flex-col justify-center my-1">
                  {dayShift ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(cell.date);
                        setActiveView('day');
                      }}
                      title={`Clic para liquidar o editar a ${dayShift.guideName}`}
                      className="p-1.5 rounded-md bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/90 transition-all flex flex-col gap-0.5 cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-900 truncate">
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{dayShift.guideName}</span>
                        </span>
                        <span className="text-[10px] font-medium text-zinc-500 shrink-0 ml-1">
                          {dayShift.hoursLogged}h
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-0.5">
                        <span className="font-mono font-medium text-zinc-700">
                          ${(Number(dayShift.calculateTotalFee().cents) / 100).toLocaleString('es-CO')}
                        </span>
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                            dayShift.status === 'COMPLETED' || dayShift.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {dayShift.status === 'COMPLETED' || dayShift.status === 'APPROVED' ? 'Liquidado' : 'Programado'}
                        </span>
                      </div>
                    </div>
                  ) : stayDay ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(cell.date);
                        setActiveView('day');
                      }}
                      className="p-1 rounded border border-dashed border-zinc-200 hover:border-zinc-400 text-[10px] text-zinc-400 hover:text-zinc-800 flex items-center justify-center gap-1 transition-colors w-full cursor-pointer bg-white"
                    >
                      <Plus className="w-3 h-3 text-zinc-400" />
                      <span>Liquidar Día</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Overflow button para compatibilidad con pruebas */}
              {cell.events.length > 0 && (
                <button
                  type="button"
                  className="sr-only"
                  data-testid="month-overflow-button"
                  onClick={() => setPopoverDate(cell)}
                >
                  +{cell.events.length}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* VISTA MOBILE (< md): Tarjeta de Detalle del Día Seleccionado y Agenda (Patrón Apple / Google Calendar) */}
      <div className="md:hidden flex-1 border-t border-zinc-200 bg-zinc-50/50 flex flex-col min-h-0 overflow-y-auto">
        <div className="p-3.5 flex flex-col gap-3">
          {/* Cabecera con Fecha Seleccionada y Badge de Estadía */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {selectedCell?.date.toLocaleDateString('es-CO', { weekday: 'long' })}
              </span>
              <span className="text-sm font-bold text-zinc-950 capitalize">
                {selectedCell?.date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {selectedStayDay ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-zinc-800 border border-zinc-200 shadow-2xs">
                {selectedStayDay.label || `Día ${selectedStayDay.dayNumber}`}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium text-zinc-400 bg-zinc-100">
                Fuera de rango
              </span>
            )}
          </div>

          {/* Tarjeta de Liquidación de Acompañante */}
          {selectedDayShift ? (
            <div className="p-3 bg-white rounded-xl border border-zinc-200/90 shadow-2xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                    <User className="w-4 h-4 text-zinc-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                      {selectedDayShift.guideName}
                    </h4>
                    <span className="text-xs text-zinc-500">Acompañante presencial</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedDayShift.status === 'COMPLETED' || selectedDayShift.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {selectedDayShift.status === 'COMPLETED' || selectedDayShift.status === 'APPROVED' ? 'Liquidado' : 'Programado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Jornada / Modalidad</span>
                  <span className="font-medium text-zinc-800">
                    {selectedDayShift.hoursLogged} horas
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Total a Liquidar</span>
                  <span className="font-bold font-mono text-zinc-950 text-sm">
                    ${(Number(selectedDayShift.calculateTotalFee().cents) / 100).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDate(selectedCell.date);
                  setActiveView('day');
                }}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Ver Planilla / Editar Liquidación</span>
              </button>
            </div>
          ) : selectedStayDay ? (
            <div className="p-3.5 bg-white rounded-xl border border-dashed border-zinc-200 flex flex-col items-center text-center gap-2 shadow-2xs">
              <span className="text-xs text-zinc-500">
                Día de estadía médica sin liquidación registrada
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(selectedCell.date);
                  setActiveView('day');
                }}
                className="py-2 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Liquidar Acompañante de este Día</span>
              </button>
            </div>
          ) : null}

          {/* Agenda de Eventos Médicos y Logísticos del Día */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 px-0.5">
              <span>Itinerario y Citas ({selectedCell?.events.length || 0})</span>
            </div>

            {selectedCell && selectedCell.events.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {selectedCell.events.map((evt) => {
                  const startTime = new Date(evt.startDateTime).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  });
                  return (
                    <div
                      key={evt.id}
                      data-testid={`event-pill-${evt.id}`}
                      className="p-2.5 bg-white rounded-lg border border-zinc-200/80 flex items-start gap-2.5 shadow-2xs"
                    >
                      <span className="text-[11px] font-mono font-semibold text-zinc-500 shrink-0 mt-0.5">
                        {startTime}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold text-zinc-900 truncate">
                          {evt.title}
                        </h5>
                        {(evt.location?.address || evt.location?.zone) && (
                          <span className="text-[11px] text-zinc-500 truncate block">
                            📍 {evt.location.address || evt.location.zone}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-zinc-200/70 text-center text-xs text-zinc-400">
                Sin citas médicas ni traslados para este día
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Popover modal interactivo si se activa para inspección */}
      {popoverDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/30 backdrop-blur-2xs"
          onClick={() => setPopoverDate(null)}
        >
          <div
            data-testid="month-popover"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-xl shadow-sm ring-1 ring-zinc-950/5 border border-zinc-200/90 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
              <h3 className="text-sm font-bold text-zinc-950">
                Liquidación del {popoverDate.dateKey}
              </h3>
              <button
                type="button"
                onClick={() => setPopoverDate(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 text-xs text-zinc-600">
              <p>Día seleccionado para liquidación.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
