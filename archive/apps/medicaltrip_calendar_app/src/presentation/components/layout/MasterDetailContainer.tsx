import React, { useState } from 'react';

export interface MasterDetailContainerProps {
  masterContent: React.ReactNode;
  detailContent: React.ReactNode;
}

export const MasterDetailContainer: React.FC<MasterDetailContainerProps> = ({
  masterContent,
  detailContent,
}) => {
  const [activeMobileTab, setActiveMobileTab] = useState<'calendar' | 'settlement'>('calendar');

  return (
    <div className="flex flex-1 overflow-hidden relative" data-testid="master-detail-container">
      {/* Mobile Tab Switcher (Visible only below lg screen size) */}
      <div className="lg:hidden absolute bottom-4 left-4 right-4 z-40 flex rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <button
          type="button"
          onClick={() => setActiveMobileTab('calendar')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
            activeMobileTab === 'calendar'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          📅 Calendario
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('settlement')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
            activeMobileTab === 'settlement'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          💰 Liquidación & Finanzas
        </button>
      </div>

      {/* Desktop 60% Left / 40% Right Split View */}
      <main
        className={`flex-1 flex flex-col overflow-hidden ${
          activeMobileTab === 'calendar' ? 'flex' : 'hidden lg:flex'
        }`}
        data-testid="master-calendar-pane"
      >
        {masterContent}
      </main>

      <section
        className={`w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col overflow-hidden ${
          activeMobileTab === 'settlement' ? 'flex' : 'hidden lg:flex'
        }`}
        data-testid="detail-settlement-pane"
      >
        {detailContent}
      </section>
    </div>
  );
};
