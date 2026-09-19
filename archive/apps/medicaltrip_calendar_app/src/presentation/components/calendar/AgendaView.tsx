import React, { useMemo } from 'react';
import { ItineraryMilestone } from '../../../domain/entities/ItineraryMilestone';
import { MilestoneCard } from './MilestoneCard';

export interface AgendaViewProps {
  milestones: ItineraryMilestone[];
  onSelectMilestone: (milestone: ItineraryMilestone) => void;
  onGpsCheckIn?: (milestone: ItineraryMilestone) => void;
  onOpenReceipt?: (milestone: ItineraryMilestone) => void;
  onOpenSignature?: (milestone: ItineraryMilestone) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  milestones,
  onSelectMilestone,
  onGpsCheckIn,
  onOpenReceipt,
  onOpenSignature,
}) => {
  // Group milestones by Date (YYYY-MM-DD)
  const groupedMilestones = useMemo(() => {
    const groups: Record<string, { date: Date; items: ItineraryMilestone[] }> = {};

    const sorted = [...milestones].sort(
      (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
    );

    sorted.forEach((m) => {
      const dateKey = m.startDateTime.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(m.startDateTime),
          items: [],
        };
      }
      groups[dateKey].items.push(m);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [milestones]);

  if (milestones.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-center" data-testid="agenda-empty">
        <div className="max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-3xl mb-2">📅</div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            No hay citas o hitos registrados
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Ajusta los filtros de búsqueda o presiona "+ Nueva Cita" para programar una actividad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 dark:bg-zinc-950" data-testid="agenda-view">
      <div className="mx-auto max-w-3xl space-y-6">
        {groupedMilestones.map(([dateKey, { date, items }], idx) => {
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div key={dateKey} className="space-y-3">
              {/* Sticky Day Header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 rounded-lg border border-zinc-200/80 bg-white/95 px-4 py-2 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 font-mono text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  D{idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold capitalize text-zinc-900 dark:text-zinc-100">
                    {date.toLocaleDateString('es-CO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h3>
                  {isToday && (
                    <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      Hoy
                    </span>
                  )}
                </div>
                <div className="ml-auto text-xs font-semibold text-zinc-400">
                  {items.length} actividad(es)
                </div>
              </div>

              {/* Day Milestone Cards List */}
              <div className="space-y-2.5 pl-2">
                {items.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onClick={onSelectMilestone}
                    onGpsCheckIn={onGpsCheckIn}
                    onOpenReceipt={onOpenReceipt}
                    onOpenSignature={onOpenSignature}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
