/**
 * Medical Trip Colombia S.A.S. - GhostDropIndicator
 * Optimistic drag-and-drop / rescheduling feedback component.
 * Renders a dashed ghost placeholder at target snap slots.
 */

import React from 'react';
import { Clock, Move } from 'lucide-react';
import { EventCategoryType } from '../../../domain/value-objects/EventCategory';

export interface GhostDropIndicatorProps {
  timeLabel?: string;
  title?: string;
  category?: EventCategoryType;
  style?: React.CSSProperties;
  className?: string;
  isInvalid?: boolean;
}

export const GhostDropIndicator: React.FC<GhostDropIndicatorProps> = ({
  timeLabel,
  title = 'Mover evento aquí',
  style,
  className = '',
  isInvalid = false,
}) => {
  return (
    <div
      data-testid="ghost-drop-indicator"
      style={style}
      className={`absolute inset-x-1 rounded-lg border-2 border-dashed transition-all duration-150 pointer-events-none z-20 flex flex-col items-center justify-center p-2 select-none ${
        isInvalid
          ? 'border-rose-400 bg-rose-50/70 text-rose-700'
          : 'border-indigo-400 bg-indigo-50/70 text-indigo-900'
      } ${className}`}
    >
      <div className="flex items-center gap-1.5 font-mono text-xs font-bold tabular-nums">
        <Move className="w-3.5 h-3.5 opacity-70 animate-bounce" />
        {timeLabel && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-70" />
            {timeLabel}
          </span>
        )}
      </div>
      {title && <span className="text-xs font-medium opacity-80 mt-0.5 truncate max-w-full">{title}</span>}
    </div>
  );
};
