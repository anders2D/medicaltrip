import React from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AgendaView } from './AgendaView';

export const CalendarContainer: React.FC = () => {
  const { activeView } = useAppContext();

  return (
    <div className="flex-1 flex flex-col bg-white border-r border-zinc-200 overflow-hidden min-h-0">
      <CalendarHeader />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeView === 'month' && <MonthView />}
        {activeView === 'week' && <WeekView />}
        {activeView === 'day' && <DayView />}
        {activeView === 'agenda' && <AgendaView />}
      </main>
    </div>
  );
};
