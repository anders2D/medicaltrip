import React from 'react';
import { useAppContext } from '../../state/AppContext';
import { 
  Receipt, 
  Users, 
  ClipboardList, 
  HeartHandshake
} from 'lucide-react';
import { ActiveModuleType } from '../../state/AppContext';

export interface ModuleNavProps {
  className?: string;
  variant?: 'all' | 'desktop' | 'mobile';
}

interface NavItem {
  id: ActiveModuleType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'settlement',
    label: 'Liquidación',
    shortLabel: 'Liquidación',
    icon: Receipt,
    description: 'Cuentas de cobro, horas y gastos en terreno'
  },
  {
    id: 'users',
    label: 'Usuarios y Roles',
    shortLabel: 'Usuarios',
    icon: Users,
    description: 'Directorio de personal y roles del sistema'
  },
  {
    id: 'plan',
    label: 'Plan Médico',
    shortLabel: 'Plan',
    icon: ClipboardList,
    description: 'Paquete clínico, cirugías, clínicas y hotel'
  },
  {
    id: 'passengers',
    label: 'Pasajeros con Paciente',
    shortLabel: 'Pasajeros',
    icon: HeartHandshake,
    description: 'Paciente titular y grupo de acompañantes'
  }
];

export const ModuleNav: React.FC<ModuleNavProps> = ({ className = '', variant = 'all' }) => {
  const { activeModule, setActiveModule } = useAppContext();
  const showDesktop = variant === 'all' || variant === 'desktop';
  const showMobile = variant === 'all' || variant === 'mobile';

  return (
    <>
      {/* Desktop Navigation (Segmented Pill Bar) */}
      {showDesktop && (
        <nav 
          className={`hidden md:flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 ${className}`}
          aria-label="Navegación de módulos principales"
          data-testid="desktop-module-nav"
        >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              data-testid={`module-tab-${item.id}`}
              aria-pressed={isActive}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 select-none ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
              }`}
              title={item.description}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      )}

      {/* Mobile Bottom Navigation Bar (Fixed at bottom) */}
      {showMobile && (
        <nav 
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800 px-2 py-1.5 safe-area-pb shadow-xs"
          aria-label="Navegación móvil"
          data-testid="mobile-module-nav"
        >
          <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  data-testid={`mobile-module-tab-${item.id}`}
                  aria-pressed={isActive}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all select-none min-h-[52px] ${
                    isActive
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 active:bg-zinc-100 dark:active:bg-zinc-800'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400 stroke-[2.25]' : 'text-zinc-400 stroke-[1.75]'}`} />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className={`text-[11px] leading-tight mt-1 tracking-tight truncate max-w-full ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}>
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};
