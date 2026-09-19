/**
 * Medical Trip Colombia S.A.S. - EventHoverCard
 * Quick hover preview card with rich metadata, staff details, inline status transitions, and edit action.
 */

import React from 'react';
import { ItineraryEvent } from '../domain/ItineraryEvent';
import { EventCategory } from '../../../domain/value-objects/EventCategory';
import { EventStatus, EventStatusType } from '../../../domain/value-objects/EventStatus';
import {
  Clock,
  MapPin,
  Building,
  User,
  Car,
  Edit2,
  X,
  Plane,
  Stethoscope,
  Activity,
  Pill,
  ChevronRight,
} from 'lucide-react';

export interface EventHoverCardProps {
  event: ItineraryEvent;
  onEdit: (event: ItineraryEvent) => void;
  onQuickStatusChange: (eventId: string, newStatus: EventStatusType) => void;
  onDelete?: (eventId: string) => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const categoryIcons: Record<string, React.ElementType> = {
  FLIGHT: Plane,
  CLINICAL: Stethoscope,
  LAB: Activity,
  PHARMACY: Pill,
  HOTEL: Building,
  TRANSFER: Car,
};

const statusColors: Record<EventStatusType, { bg: string; text: string; dot: string }> = {
  PROGRAMADO: { bg: 'bg-zinc-100', text: 'text-zinc-800', dot: 'bg-zinc-500' },
  EN_CAMINO: { bg: 'bg-amber-100', text: 'text-amber-900', dot: 'bg-amber-500' },
  EN_SITIO: { bg: 'bg-indigo-100', text: 'text-indigo-900', dot: 'bg-indigo-500' },
  COMPLETADO: { bg: 'bg-emerald-100', text: 'text-emerald-900', dot: 'bg-emerald-600' },
  CANCELADO: { bg: 'bg-rose-100', text: 'text-rose-900', dot: 'bg-rose-500' },
};

function formatTimeRange(startIso: string, endIso: string): string {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const format = (d: Date) =>
      d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${format(s)} - ${format(e)}`;
  } catch {
    return '';
  }
}

export const EventHoverCard: React.FC<EventHoverCardProps> = ({
  event,
  onEdit,
  onQuickStatusChange,
  onClose,
  className = '',
  style,
}) => {
  const Icon = categoryIcons[event.category] || Stethoscope;
  const meta = EventCategory.getMetadata(event.category);
  const statusTheme = statusColors[event.status] || statusColors.PROGRAMADO;
  const timeRange = formatTimeRange(event.startDateTime, event.endDateTime);

  return (
    <div
      data-testid={`event-hover-card-${event.id}`}
      style={style}
      onClick={(e) => e.stopPropagation()}
      className={`w-72 bg-white rounded-xl shadow-sm ring-1 ring-zinc-950/5 border border-zinc-200 p-3.5 z-50 text-zinc-900 select-none animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-800">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              {meta.label}
            </span>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-zinc-950 tabular-nums">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{timeRange}</span>
              <span className="text-zinc-500 font-normal">({event.durationMinutes}m)</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista rápida"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors active:scale-95 duration-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Title & Notes */}
      <div className="py-2">
        <h4 className="text-xs font-bold text-zinc-950 leading-snug">{event.title}</h4>
        {event.notes && (
          <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed">
            {event.notes}
          </p>
        )}
      </div>

      {/* Location & Staff Meta */}
      <div className="space-y-1.5 py-2 border-t border-zinc-100 text-xs text-zinc-700">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{event.location.address} ({event.location.zone})</span>
        </div>

        {event.providerName && (
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate font-medium text-zinc-800">{event.providerName}</span>
          </div>
        )}

        {event.assignedGuideId && (
          <div className="flex items-center gap-1.5 text-indigo-800 font-medium font-mono">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Guía Bilingüe ({event.guideHours || 0}h registradas)</span>
          </div>
        )}

        {event.assignedDriverId && (
          <div className="flex items-center gap-1.5 text-amber-900 font-medium">
            <Car className="w-3.5 h-3.5 shrink-0" />
            <span>Conductor de Flota Asignado</span>
          </div>
        )}

        {event.cost && !event.cost.isZero() && (
          <div className="flex items-center justify-between pt-1 font-mono">
            <span className="text-zinc-500 uppercase text-xs">Costo Operativo:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 tabular-nums text-xs">
              {event.cost.formatCOP()}
            </span>
          </div>
        )}
      </div>

      {/* Status & Actions Footer */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusTheme.bg} ${statusTheme.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`} />
          {EventStatus.getStatusLabel(event.status)}
        </span>

        <div className="flex items-center gap-1">
          {/* Quick status transitions */}
          {event.status === 'PROGRAMADO' && (
            <button
              type="button"
              onClick={() => onQuickStatusChange(event.id, 'EN_CAMINO')}
              className="px-2 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors flex items-center gap-0.5 cursor-pointer active:scale-95 duration-200"
            >
              <span>En Camino</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}

          {event.status === 'EN_CAMINO' && (
            <button
              type="button"
              onClick={() => onQuickStatusChange(event.id, 'EN_SITIO')}
              className="px-2 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center gap-0.5 cursor-pointer active:scale-95 duration-200"
            >
              <span>En Sitio</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}

          {event.status === 'EN_SITIO' && (
            <button
              type="button"
              onClick={() => onQuickStatusChange(event.id, 'COMPLETADO')}
              className="px-2 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-0.5 cursor-pointer active:scale-95 duration-200"
            >
              <span>Completar</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Edit trigger */}
          <button
            type="button"
            onClick={() => onEdit(event)}
            aria-label="Editar evento"
            className="p-1 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer active:scale-95 duration-200"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
