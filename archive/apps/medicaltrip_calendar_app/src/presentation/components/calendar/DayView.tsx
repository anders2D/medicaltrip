import React, { useMemo } from 'react';
import { ItineraryMilestone } from '../../../domain/entities/ItineraryMilestone';
import { MilestoneCard } from './MilestoneCard';

export interface DayViewProps {
  currentDate: Date;
  milestones: ItineraryMilestone[];
  onSelectMilestone: (milestone: ItineraryMilestone) => void;
  onSlotClick?: (date: Date, startHour: number) => void;
  onGpsCheckIn?: (milestone: ItineraryMilestone) => void;
}

const START_HOUR = 6; // 06:00 AM
const END_HOUR = 22; // 10:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR; // 16 hours
const HOUR_HEIGHT = 60; // 60px per hour

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  milestones,
  onSelectMilestone,
  onSlotClick,
  onGpsCheckIn,
}) => {
  const currentDayStr = currentDate.toISOString().split('T')[0];

  // Filter milestones for this day
  const dayMilestones = useMemo(() => {
    return milestones.filter((m) => {
      const mDayStr = m.startDateTime.toISOString().split('T')[0];
      return mDayStr === currentDayStr;
    });
  }, [milestones, currentDayStr]);

  // Collision resolution algorithm
  const positionedMilestones = useMemo(() => {
    // Sort by start time, then duration
    const sorted = [...dayMilestones].sort(
      (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
    );

    const columns: ItineraryMilestone[][] = [];

    sorted.forEach((m) => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastInCol = columns[i][columns[i].length - 1];
        if (m.startDateTime.getTime() >= lastInCol.endDateTime.getTime()) {
          columns[i].push(m);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([m]);
      }
    });

    const totalCols = Math.max(columns.length, 1);

    return sorted.map((m) => {
      // Calculate top and height based on start/end hour
      const startH = m.startDateTime.getHours() + m.startDateTime.getMinutes() / 60;
      const endH = m.endDateTime.getHours() + m.endDateTime.getMinutes() / 60;

      const clampedStart = Math.max(startH, START_HOUR);
      const clampedEnd = Math.min(Math.max(endH, clampedStart + 0.5), END_HOUR);

      const topPx = (clampedStart - START_HOUR) * HOUR_HEIGHT;
      const heightPx = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 36);

      // Find column index
      let colIdx = 0;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].some((item) => item.id === m.id)) {
          colIdx = i;
          break;
        }
      }

      const widthPct = 100 / totalCols;
      const leftPct = colIdx * widthPct;

      return {
        milestone: m,
        topPx,
        heightPx,
        widthPct,
        leftPct,
      };
    });
  }, [dayMilestones]);

  const hoursArray = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-900" data-testid="day-view">
      {/* Day Title Banner */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-zinc-50/95 px-6 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {currentDate.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <span className="text-xs font-semibold text-zinc-500">
          {dayMilestones.length} hito(s) programado(s)
        </span>
      </div>

      {/* Time Grid */}
      <div className="relative flex flex-1">
        {/* Hour Labels Column */}
        <div className="w-16 flex-shrink-0 border-r border-zinc-200 bg-zinc-50/50 select-none dark:border-zinc-800 dark:bg-zinc-900/50">
          {hoursArray.map((hour) => (
            <div
              key={hour}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="relative -top-2.5 pr-2 text-right font-mono text-[11px] font-semibold text-zinc-400"
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Grid Area with Slots */}
        <div
          className="relative flex-1"
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
        >
          {hoursArray.map((hour) => (
            <div
              key={hour}
              onClick={() => onSlotClick && onSlotClick(currentDate, hour)}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="border-b border-zinc-100 hover:bg-sky-50/30 dark:border-zinc-800/60 dark:hover:bg-sky-950/20 cursor-pointer transition-colors"
              title={`Hacer clic para crear evento a las ${hour}:00`}
            />
          ))}

          {/* Positioned Milestone Cards */}
          {positionedMilestones.map(({ milestone, topPx, heightPx, widthPct, leftPct }) => (
            <div
              key={milestone.id}
              style={{
                top: `${topPx}px`,
                height: `${heightPx}px`,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
              }}
              className="absolute p-1 z-10"
            >
              <MilestoneCard
                milestone={milestone}
                onClick={onSelectMilestone}
                onGpsCheckIn={onGpsCheckIn}
                compact={heightPx < 70}
                className="h-full overflow-hidden"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
