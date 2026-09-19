/**
 * Medical Trip Colombia S.A.S. - EventCard Component
 * Polymorphic, accessible event card supporting Month, Week, Day, and Agenda views
 * with semantic category color badges, tabular time formats, resize handle, and inline status transitions.
 */

import React, { useState, useRef } from 'react';
import { ItineraryEvent } from '../domain/ItineraryEvent';
import { EventCategory, EventCategoryType } from '../domain/EventCategory';
import { EventStatus, EventStatusType } from '../domain/EventStatus';
import { EventHoverCard } from './EventHoverCard';
import {
  Plane,
  Stethoscope,
  Activity,
  Pill,
  Building,
  Car,
  MapPin,
  Clock,
  User,
  ChevronRight,
} from 'lucide-react';

export interface EventCardProps {
  event: ItineraryEvent;
  viewType?: 'month' | 'week' | 'day' | 'agenda';
  onClick?: () => void;
  onStatusChange?: (status: EventStatusType) => void;
  onEdit?: (event: ItineraryEvent) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  className?: string;
  enableHoverPreview?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const categoryIcons: Record<EventCategoryType, React.ElementType> = {
  FLIGHT: Plane,
  CLINICAL: Stethoscope,
  LAB: Activity,
  PHARMACY: Pill,
  HOTEL: Building,
  TRANSFER: Car,
};

const categoryTheme: Record<
  EventCategoryType,
  {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
    hoverBorder: string;
  }
> = {
  FLIGHT: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-950',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    accent: 'bg-sky-500',
    hoverBorder: 'hover:border-sky-400',
  },
  CLINICAL: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-950',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    accent: 'bg-indigo-600',
    hoverBorder: 'hover:border-indigo-400',
  },
  LAB: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-950',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    accent: 'bg-teal-600',
    hoverBorder: 'hover:border-teal-400',
  },
  PHARMACY: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    accent: 'bg-emerald-600',
    hoverBorder: 'hover:border-emerald-400',
  },
  HOTEL: {
    bg: 'bg-zinc-100',
    border: 'border-zinc-300',
    text: 'text-zinc-950',
    badgeBg: 'bg-zinc-200',
    badgeText: 'text-zinc-800',
    accent: 'bg-zinc-600',
    hoverBorder: 'hover:border-zinc-400',
  },
  TRANSFER: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-950',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    accent: 'bg-amber-600',
    hoverBorder: 'hover:border-amber-400',
  },
};

const statusBadgeTheme: Record<EventStatusType, { bg: string; text: string; dot: string }> = {
  PROGRAMADO: { bg: 'bg-zinc-100', text: 'text-zinc-700', dot: 'bg-zinc-500' },
  EN_CAMINO: { bg: 'bg-amber-100', text: 'text-amber-900', dot: 'bg-amber-600' },
  EN_SITIO: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-600' },
  COMPLETADO: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  CANCELADO: { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-600' },
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  viewType = 'week',
  onClick,
  onStatusChange,
  onEdit,
  style,
  isDragging = false,
  className = '',
  enableHoverPreview = false,
  draggable,
  onDragStart,
  onDragEnd,
}) => {
  const Icon = categoryIcons[event.category] || Stethoscope;
  const theme = categoryTheme[event.category] || categoryTheme.CLINICAL;
  const statusTheme = statusBadgeTheme[event.status] || statusBadgeTheme.PROGRAMADO;

  const startTimeStr = formatTime(event.startDateTime);
  const endTimeStr = formatTime(event.endDateTime);

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!enableHoverPreview) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 350);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  const handleDragStartInternal = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        id: event.id,
        durationMinutes: event.durationMinutes,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e);
    }
  };

  const isCardDraggable = draggable !== undefined ? draggable : viewType === 'week' || viewType === 'day';

  // 1. Month View Pill (Compact 1-line item)
  if (viewType === 'month') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        data-testid={`event-pill-${event.id}`}
        className={`group flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border transition-all truncate select-none cursor-pointer ${
          theme.bg
        } ${theme.border} ${theme.text} ${theme.hoverBorder} hover:brightness-95 ${
          event.status === 'CANCELADO' ? 'opacity-50 line-through' : ''
        } ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${theme.accent}`} />
        <span className="font-mono text-xs text-zinc-600 flex-shrink-0 tabular-nums font-semibold">{startTimeStr}</span>
        <span className="truncate font-semibold">{event.title}</span>
      </div>
    );
  }

  // 2. Week View Card (Timed slot card with HTML5 Drag & Drop)
  if (viewType === 'week') {
    return (
      <div
        role="button"
        tabIndex={0}
        draggable={isCardDraggable}
        onDragStart={handleDragStartInternal}
        onDragEnd={onDragEnd}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={style}
        data-testid={`event-card-${event.id}`}
        className={`absolute inset-x-1 rounded-lg border p-1.5 overflow-hidden transition-all duration-150 select-none cursor-grab active:cursor-grabbing hover:z-20 ${
          theme.bg
        } ${theme.border} ${theme.text} ${theme.hoverBorder} ${
          isDragging ? 'opacity-70 scale-[0.98] ring-2 ring-indigo-600 z-30' : ''
        } ${event.status === 'CANCELADO' ? 'opacity-50 line-through' : ''} ${className}`}
      >
        {/* Top bar: Time & Category Icon */}
        <div className="flex items-center justify-between text-xs leading-none mb-1">
          <div className="flex items-center gap-1 font-mono font-semibold tabular-nums opacity-90 text-xs">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{startTimeStr} - {endTimeStr}</span>
          </div>
          <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
        </div>

        {/* Title */}
        <p className="text-xs font-bold leading-tight line-clamp-2">{event.title}</p>

        {/* Location & Status Line */}
        <div className="mt-1 flex items-center justify-between gap-1 text-xs opacity-90">
          <div className="flex items-center gap-1 truncate max-w-[70%]">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{event.location.address}</span>
          </div>

          {/* Inline Status Progression Pill */}
          {onStatusChange && event.status !== 'COMPLETADO' && event.status !== 'CANCELADO' && (
            <button
              type="button"
              data-testid={`status-progression-${event.id}`}
              onClick={(e) => {
                e.stopPropagation();
                const nextStatus: EventStatusType =
                  event.status === 'PROGRAMADO'
                    ? 'EN_CAMINO'
                    : event.status === 'EN_CAMINO'
                    ? 'EN_SITIO'
                    : 'COMPLETADO';
                onStatusChange(nextStatus);
              }}
              title={`Estado actual: ${event.status}. Clic para avanzar.`}
              className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-xs font-bold border transition-colors cursor-pointer hover:brightness-95 ${statusTheme.bg} ${statusTheme.text}`}
            >
              <span className={`w-1 h-1 rounded-full ${statusTheme.dot}`} />
              <span className="truncate">{EventStatus.getStatusLabel(event.status)}</span>
              <ChevronRight className="w-2 h-2 shrink-0 opacity-70" />
            </button>
          )}
        </div>

        {/* Resize Handle at Bottom */}
        <div
          data-testid="event-resize-handle"
          className="absolute bottom-0 inset-x-0 h-1.5 bg-zinc-900/10 hover:bg-zinc-900/30 cursor-ns-resize"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Hover Card Popover if enabled */}
        {isHovered && enableHoverPreview && (
          <div className="absolute top-0 left-full ml-2 z-50">
            <EventHoverCard
              event={event}
              onEdit={(evt) => {
                setIsHovered(false);
                if (onEdit) onEdit(evt);
                else onClick?.();
              }}
              onQuickStatusChange={(_id, status) => {
                if (onStatusChange) onStatusChange(status);
              }}
              onClose={() => setIsHovered(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // 3. Day View Card (Rich timeline block)
  if (viewType === 'day') {
    return (
      <div
        role="button"
        tabIndex={0}
        draggable={isCardDraggable}
        onDragStart={handleDragStartInternal}
        onDragEnd={onDragEnd}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        style={style}
        data-testid={`day-event-${event.id}`}
        className={`absolute rounded-xl border p-3 flex flex-col justify-between transition-all select-none cursor-grab active:cursor-grabbing hover:z-20 ${
          theme.bg
        } ${theme.border} ${theme.text} ${theme.hoverBorder} ${
          event.status === 'CANCELADO' ? 'opacity-50 line-through' : ''
        } ${className}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${theme.badgeBg} ${theme.badgeText}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
                  {EventCategory.getMetadata(event.category).label}
                </span>
                <div className="flex items-center gap-1 font-mono text-xs font-bold tabular-nums">
                  <span>{startTimeStr} - {endTimeStr}</span>
                  <span className="text-zinc-500 font-normal font-mono">({event.durationMinutes} min)</span>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-transparent ${statusTheme.bg} ${statusTheme.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`} />
              {EventStatus.getStatusLabel(event.status)}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold leading-snug text-zinc-950 mt-1">{event.title}</h4>

          {/* Location & Provider */}
          <div className="mt-2 space-y-1 text-xs text-zinc-700">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              <span className="truncate">{event.location.address} ({event.location.zone})</span>
            </div>
            {event.providerName && (
              <div className="flex items-center gap-1.5 text-zinc-600">
                <Building className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <span className="truncate">{event.providerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions & Meta */}
        <div className="mt-3 pt-2 border-t border-zinc-200/80 flex flex-wrap items-center justify-between gap-2">
          {/* Assigned Staff */}
          <div className="flex items-center gap-2 text-xs">
            {event.assignedGuideId && (
              <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded border border-zinc-200 text-zinc-800 font-mono">
                <User className="w-3 h-3 text-indigo-600" />
                Guía ({event.guideHours || 0}h)
              </span>
            )}
            {event.assignedDriverId && (
              <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">
                <Car className="w-3 h-3 text-amber-600" />
                Conductor
              </span>
            )}
            {event.cost && !event.cost.isZero() && (
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 tabular-nums">
                {event.cost.formatCOP()}
              </span>
            )}
          </div>

          {/* Quick status transitions buttons */}
          {onStatusChange && event.status !== 'COMPLETADO' && event.status !== 'CANCELADO' && (
            <div className="flex items-center gap-1">
              {event.status === 'PROGRAMADO' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('EN_CAMINO');
                  }}
                  className="px-2 py-0.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors cursor-pointer active:scale-95 duration-200"
                >
                  En Camino
                </button>
              )}
              {(event.status === 'PROGRAMADO' || event.status === 'EN_CAMINO') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('EN_SITIO');
                  }}
                  className="px-2 py-0.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors cursor-pointer active:scale-95 duration-200"
                >
                  En Sitio
                </button>
              )}
              {event.status === 'EN_SITIO' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('COMPLETADO');
                  }}
                  className="px-2 py-0.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer active:scale-95 duration-200"
                >
                  Completar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. Agenda View Row (Full-width chronological row)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      data-testid={`agenda-event-${event.id}`}
      className={`group bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none ${
        event.status === 'CANCELADO' ? 'opacity-60 line-through' : ''
      } ${className}`}
    >
      {/* Left: Time & Category */}
      <div className="flex items-start gap-3 min-w-[200px]">
        <div className={`p-2 rounded-xl flex-shrink-0 ${theme.badgeBg} ${theme.badgeText}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
              {startTimeStr} - {endTimeStr}
            </span>
            <span className="text-xs text-zinc-500 font-mono">({event.durationMinutes}m)</span>
          </div>
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider block mt-0.5">
            {EventCategory.getMetadata(event.category).label}
          </span>
        </div>
      </div>

      {/* Center: Title, Location & Personnel */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-zinc-950 group-hover:text-indigo-600 transition-colors">
          {event.title}
        </h4>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-700 mt-1">
          <span className="flex items-center gap-1 truncate max-w-xs">
            <MapPin className="w-3 h-3 text-zinc-500" />
            {event.location.address} ({event.location.zone})
          </span>
          {event.providerName && (
            <span className="flex items-center gap-1 text-zinc-600">
              <Building className="w-3 h-3 text-zinc-500" />
              {event.providerName}
            </span>
          )}
          {event.assignedGuideId && (
            <span className="flex items-center gap-1 text-indigo-800 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 font-mono">
              <User className="w-3 h-3" />
              Guía {event.guideHours ? `(${event.guideHours}h)` : ''}
            </span>
          )}
          {event.assignedDriverId && (
            <span className="flex items-center gap-1 text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
              <Car className="w-3 h-3" />
              Conductor
            </span>
          )}
        </div>
      </div>

      {/* Right: Cost & Status Badges */}
      <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
        {/* Cost */}
        {event.cost && !event.cost.isZero() ? (
          <div className="text-right">
            <span className="font-mono text-sm font-bold text-emerald-800 block tabular-nums">
              {event.cost.formatCOP()}
            </span>
            <span className="text-xs text-zinc-500 uppercase font-mono">
              {event.financialType}
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 font-mono hidden md:inline">-</span>
        )}

        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusTheme.bg} ${statusTheme.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`} />
          {EventStatus.getStatusLabel(event.status)}
        </span>

        {/* Quick status transitions buttons */}
        {onStatusChange && event.status !== 'COMPLETADO' && event.status !== 'CANCELADO' && (
          <div className="flex items-center gap-1">
            {event.status === 'PROGRAMADO' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange('EN_CAMINO');
                }}
                className="px-2 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors cursor-pointer active:scale-95 duration-200 flex items-center gap-0.5"
              >
                <span>En Camino</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {event.status === 'EN_CAMINO' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange('EN_SITIO');
                }}
                className="px-2 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors cursor-pointer active:scale-95 duration-200 flex items-center gap-0.5"
              >
                <span>En Sitio</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {event.status === 'EN_SITIO' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange('COMPLETADO');
                }}
                className="px-2 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer active:scale-95 duration-200 flex items-center gap-0.5"
              >
                <span>Completar</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
