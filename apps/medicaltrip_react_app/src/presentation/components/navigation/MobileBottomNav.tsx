/**
 * Medical Trip Colombia S.A.S. - MobileBottomNav
 * 5-tab fixed bottom navigation bar for mobile touch viewports (<768px).
 * Tabs: Mes, Semana, Día, Agenda, Balance
 */

import React from 'react';
import { Calendar as CalendarIcon, Clock, Layers, ListFilter, Scale } from 'lucide-react';
import { useAppContext, CalendarViewType } from '../../state/AppContext';
import { useSettlement } from '../../hooks/useSettlement';

export interface MobileBottomNavProps {
  onToggleBalance?: () => void;
  isBalanceOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onToggleBalance,
  isBalanceOpen = false,
}) => {
  const { activeView, setActiveView } = useAppContext();
  const { settlementStatus } = useSettlement();

  const navItems: Array<{
    id: CalendarViewType | 'balance';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    testId: string;
  }> = [
    { id: 'month', label: 'Mes', icon: CalendarIcon, testId: 'mobile-tab-month' },
    { id: 'week', label: 'Semana', icon: Clock, testId: 'mobile-tab-week' },
    { id: 'day', label: 'Día', icon: Layers, testId: 'mobile-tab-day' },
    { id: 'agenda', label: 'Agenda', icon: ListFilter, testId: 'mobile-tab-agenda' },
    { id: 'balance', label: 'Balance', icon: Scale, testId: 'mobile-tab-balance' },
  ];

  const handleTabClick = (itemId: CalendarViewType | 'balance') => {
    if (itemId === 'balance') {
      if (onToggleBalance) {
        onToggleBalance();
      }
    } else {
      setActiveView(itemId);
    }
  };

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación móvil inferior"
    >
      <div className="grid-cols-5 flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isItemActive =
            item.id === 'balance' ? isBalanceOpen : activeView === item.id;
          const Icon = item.icon;
          const isHidden = item.id === 'week' || item.id === 'day';

          return (
            <button
              key={item.id}
              type="button"
              data-testid={item.testId}
              onClick={() => handleTabClick(item.id)}
              aria-selected={isItemActive}
              className={`${
                isHidden
                  ? 'hidden cursor-pointer select-none'
                  : 'flex-1 flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 transition-colors relative cursor-pointer select-none active:scale-95 duration-200'
              } ${
                isItemActive
                  ? 'text-zinc-950 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 font-medium'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {isItemActive && !isHidden && (
                <span className="absolute top-0 inset-x-4 h-0.5 bg-zinc-950 rounded-full" />
              )}

              <div className="relative">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isItemActive ? 'scale-110 text-zinc-950' : 'text-zinc-500'
                  }`}
                />
                {item.id === 'balance' && (
                  <span
                    className={`absolute -top-1 -right-2 w-2 h-2 rounded-full ${
                      settlementStatus === 'SETTLED'
                        ? 'bg-emerald-500'
                        : settlementStatus === 'SURPLUS_MEDICAL_TRIP'
                        ? 'bg-sky-500'
                        : 'bg-rose-500'
                    }`}
                  />
                )}
              </div>

              <span className="text-xs leading-tight tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
