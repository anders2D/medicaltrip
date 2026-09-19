import React, { useMemo } from 'react';
import { ItineraryMilestone } from '../../../domain/entities/ItineraryMilestone';
import { MilestoneCard } from './MilestoneCard';

export interface WeekViewProps {
  currentDate: Date;
  milestones: ItineraryMilestone[];
  onSelectMilestone: (milestone: ItineraryMilestone) => void;
  onSlotClick?: (date: Date, startHour: number) => void;
  onGpsCheckIn?: (milestone: ItineraryMilestone) => void;
}

const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 52;

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  milestones,
  onSelectMilestone,
  onSlotClick,
  onGpsCheckIn,
}) => {
  // Calculate 7 days of the current week (starting Monday)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const hoursArray = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-900" data-testid="week-view">
      {/* 7-Day Header Row */}
      <div className="sticky top-0 z-20 grid grid-cols-[56px_repeat(7,1fr)] border-b border-zinc-200 bg-zinc-50/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="border-r border-zinc-200 p-2 text-center text-[10px] font-bold text-zinc-400 dark:border-zinc-800">
          GMT-5
        </div>
        {weekDays.map((d, idx) => {
          const isToday = d.toDateString() === new Date().toDateString();
          const isSelected = d.toDateString() === currentDate.toDateString();

          return (
            <div
              key={idx}
              className={`border-r border-zinc-200 p-2 text-center last:border-r-0 dark:border-zinc-800 ${
                isSelected ? 'bg-sky-50/60 dark:bg-sky-950/30' : ''
              }`}
            >
              <div className="text-[11px] font-bold uppercase text-zinc-500">
                {d.toLocaleDateString('es-CO', { weekday: 'short' })}
              </div>
              <div
                className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isToday
                    ? 'bg-sky-600 text-white'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="relative grid grid-cols-[56px_repeat(7,1fr)] flex-1">
        {/* Hour labels */}
        <div className="border-r border-zinc-200 bg-zinc-50/50 select-none dark:border-zinc-800 dark:bg-zinc-900/50">
          {hoursArray.map((hour) => (
            <div
              key={hour}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="relative -top-2.5 pr-2 text-right font-mono text-[10px] font-semibold text-zinc-400"
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* 7 Day Columns */}
        {weekDays.map((dayDate, dayIdx) => {
          const dayDateStr = dayDate.toISOString().split('T')[0];
          const dayMilestones = milestones.filter(
            (m) => m.startDateTime.toISOString().split('T')[0] === dayDateStr
          );

          return (
            <div
              key={dayIdx}
              className="relative border-r border-zinc-100 last:border-r-0 dark:border-zinc-800/80"
              style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
            >
              {/* Hour slot background lines */}
              {hoursArray.map((hour) => (
                <div
                  key={hour}
                  onClick={() => onSlotClick && onSlotClick(dayDate, hour)}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-zinc-100 hover:bg-sky-50/30 dark:border-zinc-800/40 dark:hover:bg-sky-950/20 cursor-pointer transition-colors"
                />
              ))}

              {/* Milestones inside this column */}
              {dayMilestones.map((m) => {
                const startH = m.startDateTime.getHours() + m.startDateTime.getMinutes() / 60;
                const endH = m.endDateTime.getHours() + m.endDateTime.getMinutes() / 60;

                const clampedStart = Math.max(startH, START_HOUR);
                const clampedEnd = Math.min(Math.max(endH, clampedStart + 0.5), END_HOUR);

                const topPx = (clampedStart - START_HOUR) * HOUR_HEIGHT;
                const heightPx = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 32);

                return (
                  <div
                    key={m.id}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      left: '2px',
                      right: '2px',
                    }}
                    className="absolute z-10"
                  >
                    <MilestoneCard
                      milestone={m}
                      onClick={onSelectMilestone}
                      onGpsCheckIn={onGpsCheckIn}
                      compact={true}
                      className="h-full p-2 text-xs overflow-hidden"
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
