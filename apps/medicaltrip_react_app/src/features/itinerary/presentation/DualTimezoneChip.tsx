/**
 * Medical Trip Colombia S.A.S. - DualTimezoneChip
 * Minimalist Dual-Timezone Indicator displaying synchronized live Colombia Time (COT, UTC-5)
 * and Caribbean Standard Time (AST, UTC-4) for Curaçao, Aruba, and Bonaire.
 */

import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export interface DualTimezoneChipProps {
  className?: string;
  showIcon?: boolean;
}

export const DualTimezoneChip: React.FC<DualTimezoneChipProps> = ({
  className = '',
  showIcon = true,
}) => {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format COT (America/Bogota, UTC-5)
  const cotTimeStr = time.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Format AST (America/Curacao, UTC-4)
  const astTimeStr = time.toLocaleTimeString('es-CO', {
    timeZone: 'America/Curacao',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div
      data-testid="dual-timezone-chip"
      title="Sincronización horaria: Colombia (COT, UTC-5) / Caribe (AST, UTC-4)"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100/90 border border-zinc-200/80 text-zinc-700 text-xs select-none ${className}`}
    >
      {showIcon && <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
      <div className="flex items-center gap-1 font-mono tabular-nums font-medium text-xs">
        <span className="font-semibold text-zinc-950">{cotTimeStr}</span>
        <span className="text-xs text-zinc-500 font-semibold uppercase">COT</span>
        <span className="text-zinc-300 font-normal">/</span>
        <span className="font-semibold text-zinc-950">{astTimeStr}</span>
        <span className="text-xs text-zinc-500 font-semibold uppercase">AST</span>
      </div>
    </div>
  );
};

export default DualTimezoneChip;
