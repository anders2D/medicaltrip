/**
 * Medical Trip Colombia S.A.S. - PatientItinerarySection
 * Agenda clínica día a día para el paciente internacional:
 * - Horarios en tabular-nums font-mono
 * - Badges de categoría (Consulta Médica, Laboratorio, Farmacia, Traslado)
 * - Nombre de clínica, especialista e instrucciones de preparación
 * - CERO costos financieros en el DOM ($ COP)
 * - CERO tipos financieros en el DOM (OUT_OF_POCKET, GUIDE_FEE, etc.)
 * - CERO botones de mutación de estado o handles de edición/eliminación
 */

import React, { useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { Calendar, Clock, MapPin, Stethoscope, AlertCircle, Sparkles } from 'lucide-react';

export const PatientItinerarySection: React.FC = () => {
  const { events, activeBooking } = useAppContext();

  // Group events by dayNumber
  const groupedDays = useMemo(() => {
    if (!events || events.length === 0) return [];

    const map = new Map<number, typeof events>();
    for (const evt of events) {
      const day = evt.dayNumber || 1;
      const list = map.get(day) || [];
      list.push(evt);
      map.set(day, list);
    }

    const sortedDays = Array.from(map.keys()).sort((a, b) => a - b);
    return sortedDays.map((dayNum) => {
      const dayEvents = map.get(dayNum)!;
      // Sort events by startDateTime
      dayEvents.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
      return {
        dayNumber: dayNum,
        events: dayEvents,
        dateString: dayEvents[0]?.startDateTime || '',
      };
    });
  }, [events]);

  const formatEventTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '--:--';
    }
  };

  const formatDayHeader = (dayNumber: number, isoString: string) => {
    try {
      const d = new Date(isoString);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      };
      const formatted = d.toLocaleDateString('es-CO', options);
      return `Día ${dayNumber} • ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
    } catch {
      return `Día ${dayNumber}`;
    }
  };

  const getCategoryBadge = (category: string) => {
    const cat = category?.toUpperCase() || 'CLINICAL';
    switch (cat) {
      case 'CLINICAL':
        return {
          label: 'Consulta Especializada',
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
        };
      case 'LAB':
        return {
          label: 'Laboratorio & Diagnóstico',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
        };
      case 'PHARMACY':
        return {
          label: 'Medicamentos & Farmacia',
          className: 'bg-teal-50 text-teal-700 border-teal-200/70',
        };
      case 'FLIGHT':
        return {
          label: 'Vuelo & Llegada',
          className: 'bg-sky-50 text-sky-700 border-sky-200/70',
        };
      case 'SURGERY':
      case 'HOSPITAL':
        return {
          label: 'Procedimiento Quirúrgico',
          className: 'bg-rose-50 text-rose-700 border-rose-200/70',
        };
      default:
        return {
          label: 'Actividad Médica',
          className: 'bg-zinc-50 text-zinc-700 border-zinc-200/70',
        };
    }
  };

  return (
    <section data-testid="patient-itinerary-section" className="space-y-6">
      {/* Section Overview Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Itinerario Clínico Personalizado</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cronograma de consultas, exámenes diagnósticos y preparaciones médicas en Medellín
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
            <span className="px-2.5 py-1 bg-zinc-100 rounded-lg font-mono tabular-nums text-zinc-700">
              {events.length} actividades programadas
            </span>
          </div>
        </div>

        {/* Patient Clinical Info Highlights */}
        {activeBooking?.notes && (
          <div className="mt-4 p-3.5 bg-indigo-50/50 border border-indigo-200/60 rounded-xl flex items-start gap-2.5 text-xs text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-900">Objetivo del Viaje Médico:</p>
              <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
                {activeBooking.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Day by Day Clinical Agenda */}
      {groupedDays.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-8 text-center text-xs text-zinc-500">
          No hay actividades clínicas programadas para esta reserva en este momento.
        </div>
      ) : (
        groupedDays.map(({ dayNumber, events: dayEvents, dateString }) => (
          <div
            key={dayNumber}
            data-testid={`itinerary-day-${dayNumber}`}
            className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs"
          >
            {/* Day Header */}
            <div className="px-5 py-3 bg-zinc-50/70 border-b border-zinc-200/70 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-2 font-mono">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formatDayHeader(dayNumber, dateString)}</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                {dayEvents.length} {dayEvents.length === 1 ? 'cita' : 'citas'}
              </span>
            </div>

            {/* Events List */}
            <div className="divide-y divide-zinc-100">
              {dayEvents.map((evt) => {
                const badge = getCategoryBadge(evt.category);
                const startTime = formatEventTime(evt.startDateTime);
                const endTime = formatEventTime(evt.endDateTime);
                const locationText = typeof evt.location === 'object' && evt.location !== null
                  ? (evt.location as any).name || (evt.location as any).label || 'Medellín'
                  : String(evt.location || 'Medellín');

                return (
                  <div
                    key={evt.id}
                    data-testid={`patient-event-item-${evt.id}`}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 hover:bg-zinc-50/40 transition-colors"
                  >
                    {/* Time Column */}
                    <div className="sm:w-32 shrink-0 flex items-center sm:flex-col sm:items-start gap-1 sm:gap-0">
                      <span className="text-xs font-bold text-zinc-950 font-mono tabular-nums">
                        {startTime}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono tabular-nums sm:mt-0.5">
                        hasta {endTime}
                      </span>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-zinc-950 leading-snug">
                        {evt.title}
                      </h4>

                      {/* Provider & Location Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-600">
                        {evt.providerName && (
                          <span className="flex items-center gap-1 font-medium text-zinc-800">
                            <Stethoscope className="w-3 h-3 text-indigo-500" />
                            {evt.providerName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-zinc-500">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          {locationText}
                        </span>
                      </div>

                      {/* Patient Instructions / Notes */}
                      {evt.notes && (
                        <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/60 text-[11px] text-zinc-700 flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-zinc-900">Indicaciones para el paciente: </span>
                            <span>{evt.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
};
