/**
 * Medical Trip Colombia S.A.S. - AgendaView Component
 * Chronological sequential itinerary with sticky day banners, daily cost aggregations in COP,
 * rich multi-column row cards, and inline status transition controls.
 */

import React, { useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { ItineraryEvent } from '../domain/ItineraryEvent';
import { EventCard } from './EventCard';
import { Button } from '@/core/ui/Button';
import { ArrivalTrackingCard } from '@/features/logistics-fleet';
import { Calendar, Plus } from 'lucide-react';
import { Money } from '../../../domain/value-objects/Money';

interface DayGroup {
  dateKey: string;
  formattedDate: string;
  dayNumber: number;
  events: ItineraryEvent[];
  totalDayCost: Money;
}

export const AgendaView: React.FC = () => {
  const { events, openCreateDrawer, openEditDrawer, transitionEventStatus } = useAppContext();

  // Group and sort events chronologically
  const dayGroups = useMemo<DayGroup[]>(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    const groupsMap = new Map<string, { events: ItineraryEvent[]; dayNumber: number }>();

    for (const evt of sorted) {
      try {
        const d = new Date(evt.startDateTime);
        const dateKey = d.toISOString().split('T')[0];
        if (!groupsMap.has(dateKey)) {
          groupsMap.set(dateKey, { events: [], dayNumber: evt.dayNumber || 1 });
        }
        groupsMap.get(dateKey)!.events.push(evt);
      } catch {
        // ignore
      }
    }

    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const daysOfWeek = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    const result: DayGroup[] = [];

    groupsMap.forEach(({ events: groupEvents, dayNumber }, dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      const dayName = daysOfWeek[dateObj.getDay()];
      const monthName = months[dateObj.getMonth()];
      const formattedDate = `${dayName}, ${d} de ${monthName} ${y}`;

      let totalDayCost = Money.zero();
      for (const e of groupEvents) {
        if (e.cost && !e.cost.isZero()) {
          totalDayCost = totalDayCost.add(e.cost);
        }
      }

      result.push({
        dateKey,
        formattedDate,
        dayNumber,
        events: groupEvents,
        totalDayCost,
      });
    });

    return result;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white select-none">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-950">No hay eventos en la agenda</h3>
        <p className="text-xs text-zinc-600 max-w-sm mt-1 mb-4 leading-relaxed">
          Comienza programando la llegada del paciente, consultas médicas o traslados ejecutivos.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => openCreateDrawer()}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Crear Primer Evento
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 bg-zinc-50/50 p-4 sm:p-6 overflow-y-auto select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* JMC Airport Arrival & Logistics Tracking Card */}
        <ArrivalTrackingCard />

        {dayGroups.map((group) => (
          <section key={group.dateKey} className="space-y-2.5">
            {/* Sticky Day Header Banner */}
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-zinc-200">
              <div className="flex items-center gap-2.5">
                <span className="bg-zinc-900 text-white text-xs font-bold px-2 py-0.5 rounded-md font-mono tabular-nums">
                  Día {group.dayNumber}
                </span>
                <h3 className="text-sm font-bold text-zinc-950 tracking-tight">
                  {group.formattedDate}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-600 font-mono">
                <span className="tabular-nums font-medium">{group.events.length} eventos</span>
                {!group.totalDayCost.isZero() && (
                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 tabular-nums">
                    Total: {group.totalDayCost.formatCOP()}
                  </span>
                )}
              </div>
            </div>

            {/* Event List in Day */}
            <div className="space-y-2">
              {group.events.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  viewType="agenda"
                  onClick={() => openEditDrawer(evt)}
                  onStatusChange={(status) => transitionEventStatus(evt.id, status)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
