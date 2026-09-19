/**
 * Medical Trip Colombia S.A.S. - WeekView Component
 * 06:00 to 22:00 Time Grid (GMT-5) with proportional event positioning,
 * live current-time indicator line across Today, 15-minute snapping,
 * drag-and-drop feedback with GhostDropIndicator, and adaptive tablet/mobile scrolling.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { ItineraryEvent } from '../domain/ItineraryEvent';
import { EventCard } from './EventCard';
import { GhostDropIndicator } from './GhostDropIndicator';

const START_HOUR = 6; // 06:00
const END_HOUR = 22; // 22:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 16 hours
const HOUR_HEIGHT = 56; // px per hour

export const WeekView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    events,
    openCreateDrawer,
    openEditDrawer,
    rescheduleEvent,
    transitionEventStatus,
  } = useAppContext();

  // Compute 7 days of the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOffset = (curr.getDay() + 6) % 7; // Monday is 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOffset);
    monday.setHours(0, 0, 0, 0);

    const days: Array<{
      date: Date;
      dateKey: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const todayKey = new Date().toISOString().split('T')[0];
    const selectedKey = selectedDate.toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateKey,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedKey,
      });
    }

    return days;
  }, [selectedDate]);

  // Hours array for vertical time axis [6, 7, ..., 22]
  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      arr.push(h);
    }
    return arr;
  }, []);

  // Filter events by day and calculate relative positioning
  const eventsByDay = useMemo(() => {
    const map = new Map<string, ItineraryEvent[]>();
    for (const d of weekDays) {
      map.set(d.dateKey, []);
    }

    for (const evt of events) {
      try {
        const start = new Date(evt.startDateTime);
        if (!isNaN(start.getTime())) {
          const key = start.toISOString().split('T')[0];
          if (map.has(key)) {
            map.get(key)!.push(evt);
          }
        }
      } catch {
        // ignore invalid dates
      }
    }
    return map;
  }, [events, weekDays]);

  // Helper to compute top and height in px
  const computeEventStyle = (evt: ItineraryEvent): React.CSSProperties => {
    const start = new Date(evt.startDateTime);
    const end = new Date(evt.endDateTime);

    const startH = start.getHours() + start.getMinutes() / 60;
    const endH = end.getHours() + end.getMinutes() / 60;

    // Clamp to 06:00 - 22:00 bounds
    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR, startH));
    const clampedEnd = Math.max(START_HOUR, Math.min(END_HOUR, endH));

    const top = (clampedStart - START_HOUR) * HOUR_HEIGHT;
    const rawHeight = (clampedEnd - clampedStart) * HOUR_HEIGHT;
    const height = Math.max(28, rawHeight);

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  // Live Current-Time Indicator calculation
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHourFraction = currentTimeMinutes / 60;
  const isTimeInOperatingWindow = currentHourFraction >= START_HOUR && currentHourFraction <= END_HOUR;
  const currentTimeTopPx = (currentHourFraction - START_HOUR) * HOUR_HEIGHT;

  // Drag-and-drop / Rescheduling state
  const [hoverTargetSlot, setHoverTargetSlot] = useState<{
    dateKey: string;
    top: number;
    height: number;
    timeLabel: string;
    snappedHour: number;
    snappedMin: number;
  } | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  const handleDragOverColumn = (e: React.DragEvent<HTMLDivElement>, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget?.getBoundingClientRect?.();
    const rawY = typeof e.clientY === 'number' && !isNaN(e.clientY) ? e.clientY : 0;
    const clickY = Math.max(0, rawY - (rect?.top || 0));
    const hourFraction = Math.max(0, Math.min(TOTAL_HOURS, clickY / HOUR_HEIGHT));
    const rawMinutes = START_HOUR * 60 + hourFraction * 60;
    const snappedMinutes = Math.floor(rawMinutes / 15) * 15;
    const clampedMinutes = Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60, snappedMinutes));
    const snappedHour = isNaN(clampedMinutes) ? START_HOUR : Math.floor(clampedMinutes / 60);
    const snappedMin = isNaN(clampedMinutes) ? 0 : clampedMinutes % 60;

    const topPx = ((snappedHour + snappedMin / 60 - START_HOUR) * HOUR_HEIGHT);
    const activeEvt = events.find((evt) => evt.id === draggedEventId);
    const durationMin = activeEvt ? activeEvt.durationMinutes : 60;
    const heightPx = Math.max(28, (durationMin / 60) * HOUR_HEIGHT);
    const timeLabel = `${String(snappedHour).padStart(2, '0')}:${String(snappedMin).padStart(2, '0')}`;

    setHoverTargetSlot({
      dateKey,
      top: topPx,
      height: heightPx,
      timeLabel,
      snappedHour,
      snappedMin,
    });
  };

  const handleDragLeaveColumn = (e: React.DragEvent<HTMLDivElement>, dateKey: string) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && !e.currentTarget.contains(relatedTarget)) {
      setHoverTargetSlot((curr) => (curr?.dateKey === dateKey ? null : curr));
    }
  };

  const handleDropOnColumn = async (e: React.DragEvent<HTMLDivElement>, dateKey: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer?.getData?.('text/plain') || draggedEventId;
    const targetSlot = hoverTargetSlot;

    // Capture geometry synchronously
    const rawY =
      typeof e.clientY === 'number' && !isNaN(e.clientY) && e.clientY > 0
        ? e.clientY
        : typeof (e.nativeEvent as any)?.clientY === 'number' && (e.nativeEvent as any).clientY > 0
        ? (e.nativeEvent as any).clientY
        : 0;
    const currentTarget = e.currentTarget;
    const rect = currentTarget?.getBoundingClientRect ? currentTarget.getBoundingClientRect() : null;
    const clickY = Math.max(0, rawY - (rect?.top || 0));

    setHoverTargetSlot(null);
    setDraggedEventId(null);

    if (!eventId) return;
    const existing = events.find((evt) => evt.id === eventId);
    if (!existing) return;

    let hour = targetSlot?.snappedHour;
    let min = targetSlot?.snappedMin;

    const timeSlotStr = e.dataTransfer?.getData?.('application/time-slot');
    if (timeSlotStr) {
      try {
        const parsed = JSON.parse(timeSlotStr);
        if (typeof parsed.hour === 'number' && !isNaN(parsed.hour)) hour = parsed.hour;
        if (typeof parsed.min === 'number' && !isNaN(parsed.min)) min = parsed.min;
      } catch {}
    }

    if (typeof hour !== 'number' || isNaN(hour) || typeof min !== 'number' || isNaN(min)) {
      const hourFraction = Math.max(0, Math.min(TOTAL_HOURS, clickY / HOUR_HEIGHT));
      const rawMinutes = START_HOUR * 60 + hourFraction * 60;
      const snappedMinutes = Math.floor(rawMinutes / 15) * 15;
      const clampedMinutes = Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60, snappedMinutes));
      hour = isNaN(clampedMinutes) ? START_HOUR : Math.floor(clampedMinutes / 60);
      min = isNaN(clampedMinutes) ? 0 : clampedMinutes % 60;
    }

    const durationMs = (existing.durationMinutes || 60) * 60 * 1000;
    const [yearStr, monthStr, dayStr] = dateKey.split('-');
    const startDate = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr), hour, min, 0);
    const endDate = new Date(startDate.getTime() + durationMs);

    const endH = String(endDate.getHours()).padStart(2, '0');
    const endM = String(endDate.getMinutes()).padStart(2, '0');
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');

    const newStartIso = `${dateKey}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000-05:00`;
    const newEndIso = `${endYear}-${endMonth}-${endDay}T${endH}:${endM}:00.000-05:00`;

    await rescheduleEvent(eventId, newStartIso, newEndIso);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-white overflow-hidden select-none">
      {/* 7-Day Sticky Header */}
      <div className="overflow-x-auto shrink-0 border-b border-zinc-200 bg-zinc-50 sticky top-0 z-20">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] min-w-[700px]">
          {/* Time axis corner */}
          <div className="p-2 text-center text-xs font-mono text-zinc-500 border-r border-zinc-200 flex items-center justify-center font-bold">
            GMT-5
          </div>

          {/* 7 Day Columns Headers */}
          {weekDays.map((day) => (
            <div
              key={day.dateKey}
              onClick={() => setSelectedDate(day.date)}
              className={`p-2 text-center border-r border-zinc-200 last:border-r-0 cursor-pointer transition-colors hover:bg-zinc-100/60 ${
                day.isSelected ? 'bg-zinc-100/80' : ''
              }`}
            >
              <span className="text-xs font-semibold text-zinc-600 block uppercase">
                {day.dayName}
              </span>
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-0.5 tabular-nums ${
                  day.isToday
                    ? 'bg-rose-600 text-white'
                    : day.isSelected
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-900'
                }`}
              >
                {day.dayNumber}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Synchronized Hourly Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-auto relative">
        <div
          className="grid grid-cols-[64px_repeat(7,1fr)] min-w-[700px] relative"
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
        >
          {/* Left Time Gutter */}
          <div className="border-r border-zinc-200 bg-zinc-50/50 flex flex-col justify-between select-none">
            {hours.map((h) => (
              <div
                key={h}
                className="relative text-right pr-2 text-xs font-mono text-zinc-500 tabular-nums"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="-top-2 relative font-medium">{`${String(h).padStart(2, '0')}:00`}</span>
              </div>
            ))}
          </div>

          {/* 7 Day Event Columns */}
          {weekDays.map((day) => {
            const dayEvents = eventsByDay.get(day.dateKey) || [];

            return (
              <div
                key={day.dateKey}
                data-testid={`week-column-${day.dateKey}`}
                onDragOver={(e) => handleDragOverColumn(e, day.dateKey)}
                onDragLeave={(e) => handleDragLeaveColumn(e, day.dateKey)}
                onDrop={(e) => handleDropOnColumn(e, day.dateKey)}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('[data-testid^="event-card-"]')) {
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const hourFraction = clickY / HOUR_HEIGHT;
                  const clickedHour = Math.floor(START_HOUR + hourFraction);
                  const min15 = Math.floor(((hourFraction % 1) * 60) / 15) * 15;
                  const startHourStr = `${String(clickedHour).padStart(2, '0')}:${String(
                    min15
                  ).padStart(2, '0')}`;
                  const endHourStr = `${String(clickedHour + 1).padStart(2, '0')}:${String(
                    min15
                  ).padStart(2, '0')}`;
                  openCreateDrawer({
                    date: day.dateKey,
                    startTime: startHourStr,
                    endTime: endHourStr,
                  });
                }}
                className={`relative border-r border-zinc-200 last:border-r-0 hover:bg-zinc-50/40 transition-colors cursor-pointer ${
                  day.isSelected ? 'bg-zinc-50/30' : ''
                }`}
              >
                {/* Horizontal Gridlines */}
                {hours.slice(0, -1).map((h) => (
                  <div
                    key={h}
                    className="border-b border-zinc-100 relative pointer-events-none"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    {/* 30-min subtle dotted divider */}
                    <div
                      className="border-b border-dashed border-zinc-100/80 absolute inset-x-0"
                      style={{ top: `${HOUR_HEIGHT / 2}px` }}
                    />
                  </div>
                ))}

                {/* Live Current-Time Indicator Line (only on Today column) */}
                {day.isToday && isTimeInOperatingWindow && (
                  <div
                    className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${currentTimeTopPx}px` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-600 -ml-1.5 animate-pulse" />
                    <div className="flex-1 h-[2px] bg-rose-500" />
                  </div>
                )}

                {/* Drag Target Ghost Drop Indicator */}
                {hoverTargetSlot && hoverTargetSlot.dateKey === day.dateKey && (
                  <GhostDropIndicator
                    timeLabel={hoverTargetSlot.timeLabel}
                    title="Mover evento a este horario"
                    style={{
                      top: `${hoverTargetSlot.top}px`,
                      height: `${hoverTargetSlot.height}px`,
                    }}
                  />
                )}

                {/* Event Cards in Column */}
                {dayEvents.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    viewType="week"
                    style={computeEventStyle(evt)}
                    isDragging={draggedEventId === evt.id}
                    onDragStart={() => setDraggedEventId(evt.id)}
                    onDragEnd={() => {
                      setDraggedEventId(null);
                      setHoverTargetSlot(null);
                    }}
                    onClick={() => openEditDrawer(evt)}
                    onStatusChange={(status) => transitionEventStatus(evt.id, status)}
                    enableHoverPreview={true}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
