/**
 * Medical Trip Colombia S.A.S. - FloatingActionButton (FAB)
 * Tactile circular floating action button for quick appointment / event creation on mobile devices.
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../state/AppContext';

export interface FloatingActionButtonProps {
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ className = '' }) => {
  const { openCreateDrawer, activeView } = useAppContext();

  // Hide FAB visually when in day view (liquidation form) so it doesn't obstruct form inputs
  const isDayView = activeView === 'day';

  return (
    <button
      type="button"
      onClick={() => openCreateDrawer()}
      data-testid="mobile-fab-create-event"
      aria-label="Crear nuevo evento o cita médica"
      className={`${
        isDayView ? 'hidden' : 'md:hidden'
      } fixed bottom-20 right-4 z-40 w-14 h-14 bg-zinc-950 text-white rounded-full shadow-sm ring-1 ring-white/10 flex items-center justify-center active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer border border-white/20 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 ${className}`}
    >
      <Plus className="w-6 h-6 stroke-[2.5]" />
    </button>
  );
};
