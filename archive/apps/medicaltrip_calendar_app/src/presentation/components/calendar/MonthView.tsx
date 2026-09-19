import React, { useMemo, useState } from 'react';
import { ItineraryMilestone } from '../../../domain/entities/ItineraryMilestone';

export interface MonthViewProps {
  currentDate: Date;
  milestones: ItineraryMilestone[];
  onSelectMilestone: (milestone: ItineraryMilestone) => void;
  onDayClick?: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  milestones,
  onSelectMilestone,
  onDayClick,
}) => {
  const [popoverDay, setPopoverDay] = useState<string | null>(null);

  const { monthCells } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Calculate days to prepend from previous month so week starts on Monday
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const cells: Array<{
      date: Date;
      isCurrentMonth: boolean;
      dateStr: string;
    }> = [];

    // Prepend previous month days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0],
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({
        date,
        isCurrentMonth: true,
        dateStr: date.toISOString().split('T')[0],
      });
    }

    // Append next month days to make full rows of 7
    while (cells.length % 7 !== 0 || cells.length < 35) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last);
      d.setDate(last.getDate() + 1);
      cells.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0],
      });
    }

    return { monthCells: cells };
  }, [currentDate]);

  const weekDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-900" data-testid="month-view">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 sticky top-0 z-10">
        {weekDayNames.map((name, i) => (
          <div
            key={i}
            className="border-r border-zinc-200 p-2 text-center text-xs font-bold uppercase text-zinc-500 last:border-r-0 dark:border-zinc-800"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Month Matrix Grid */}
      <div className="grid grid-cols-7 flex-1 border-b border-zinc-200 dark:border-zinc-800 auto-rows-fr">
        {monthCells.map(({ date, isCurrentMonth, dateStr }, cellIdx) => {
          const dayMilestones = milestones.filter(
            (m) => m.startDateTime.toISOString().split('T')[0] === dateStr
          );

          const isToday = date.toDateString() === new Date().toDateString();
          const maxPills = 3;
          const overflowCount = dayMilestones.length - maxPills;
          const isPopoverOpen = popoverDay === dateStr;

          return (
            <div
              key={cellIdx}
              onClick={() => onDayClick && onDayClick(date)}
              className={`relative flex min-h-[105px] flex-col border-b border-r border-zinc-200 p-1.5 transition-colors last:border-r-0 hover:bg-zinc-50/70 dark:border-zinc-800 dark:hover:bg-zinc-800/40 cursor-pointer ${
                !isCurrentMonth
                  ? 'bg-zinc-50/40 text-zinc-400 dark:bg-zinc-950/40 dark:text-zinc-600'
                  : 'bg-white dark:bg-zinc-900'
              }`}
            >
              {/* Day number header */}
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? 'bg-sky-600 text-white'
                      : isCurrentMonth
                      ? 'text-zinc-800 dark:text-zinc-200'
                      : 'text-zinc-400'
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayMilestones.length > 0 && (
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {dayMilestones.length}
                  </span>
                )}
              </div>

              {/* Event Pills */}
              <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                {dayMilestones.slice(0, maxPills).map((m) => {
                  const startTimeStr = m.startDateTime.toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  });

                  const pillColors = {
                    FLIGHT: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300',
                    CLINICAL: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300',
                    LAB: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300',
                    PHARMACY: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
                    HOTEL: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
                    LOGISTICS: 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300',
                  }[m.category] || 'bg-zinc-100 text-zinc-800 border-zinc-300';

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMilestone(m);
                      }}
                      className={`truncate rounded px-1.5 py-0.5 text-left text-[11px] font-semibold border ${pillColors} hover:opacity-85 transition-opacity`}
                      title={`${m.title} (${startTimeStr})`}
                    >
                      <span className="font-mono text-[10px] font-bold mr-1">{startTimeStr}</span>
                      {m.title}
                    </button>
                  );
                })}

                {/* Overflow +N más */}
                {overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopoverDay(isPopoverOpen ? null : dateStr);
                    }}
                    className="rounded bg-zinc-100 px-1 py-0.5 text-left text-[10px] font-bold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    +{overflowCount} más...
                  </button>
                )}
              </div>

              {/* Popover list for overflow */}
              {isPopoverOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-2 right-2 top-8 z-30 flex flex-col gap-1 rounded-lg border border-zinc-300 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-1 dark:border-zinc-700">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPopoverDay(null)}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex max-h-40 flex-col gap-1 overflow-y-auto pt-1">
                    {dayMilestones.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPopoverDay(null);
                          onSelectMilestone(m);
                        }}
                        className="truncate rounded bg-zinc-50 p-1 text-left text-xs font-medium hover:bg-sky-50 hover:text-sky-700 dark:bg-zinc-900 dark:hover:bg-sky-950"
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
