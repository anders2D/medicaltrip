import React from 'react';
import { ItineraryMilestone } from '../../../domain/entities/ItineraryMilestone';
import { CategoryBadge } from '../common/CategoryBadge';
import { MoneyDisplay } from '../common/MoneyDisplay';

export interface MilestoneCardProps {
  milestone: ItineraryMilestone;
  onClick?: (milestone: ItineraryMilestone) => void;
  onGpsCheckIn?: (milestone: ItineraryMilestone) => void;
  onOpenReceipt?: (milestone: ItineraryMilestone) => void;
  onOpenSignature?: (milestone: ItineraryMilestone) => void;
  compact?: boolean;
  className?: string;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onClick,
  onGpsCheckIn,
  onOpenReceipt,
  onOpenSignature,
  compact = false,
  className = '',
}) => {
  const startTime = milestone.startDateTime.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const endTime = milestone.endDateTime.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const durationMin = Math.round(
    (milestone.endDateTime.getTime() - milestone.startDateTime.getTime()) / (1000 * 60)
  );
  const durationHours = (durationMin / 60).toFixed(1).replace('.0', '');

  const statusConfig = {
    PROGRAMADO: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      label: 'PROGRAMADO',
      dot: 'bg-blue-500',
    },
    EN_CAMINO: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      label: 'EN CAMINO',
      dot: 'bg-amber-500 animate-pulse',
    },
    EN_SITIO: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
      label: 'EN SITIO',
      dot: 'bg-indigo-500',
    },
    COMPLETADO: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      label: 'COMPLETADO',
      dot: 'bg-emerald-500',
    },
    CANCELADO: {
      bg: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
      label: 'CANCELADO',
      dot: 'bg-zinc-400',
    },
  }[milestone.status] || {
    bg: 'bg-zinc-50 text-zinc-700 border-zinc-200',
    label: milestone.status,
    dot: 'bg-zinc-400',
  };

  const categoryColorBorder = {
    FLIGHT: 'border-l-sky-500 hover:border-sky-600',
    CLINICAL: 'border-l-indigo-500 hover:border-indigo-600',
    LAB: 'border-l-teal-500 hover:border-teal-600',
    PHARMACY: 'border-l-amber-500 hover:border-amber-600',
    HOTEL: 'border-l-slate-500 hover:border-slate-600',
    LOGISTICS: 'border-l-zinc-500 hover:border-zinc-600',
  }[milestone.category] || 'border-l-zinc-400';

  return (
    <div
      onClick={() => onClick && onClick(milestone)}
      data-testid={`milestone-card-${milestone.id}`}
      className={`group relative flex flex-col justify-between rounded-lg border border-zinc-200 border-l-4 ${categoryColorBorder} bg-white p-3.5 shadow-sm transition-all hover:shadow-md cursor-pointer dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <div>
        {/* Top bar: Category + Time + Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CategoryBadge category={milestone.category} size={compact ? 'sm' : 'md'} />
            <span className="font-mono text-xs font-semibold text-zinc-500 tabular-nums dark:text-zinc-400">
              {startTime} – {endTime} ({durationHours}h)
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${statusConfig.bg}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Title */}
        <h4 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 transition-colors line-clamp-2">
          {milestone.title}
        </h4>

        {/* Location & Provider */}
        <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
          <span>📍</span>
          <span>{milestone.location.rawName}</span>
          {milestone.providerName && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {milestone.providerName}
              </span>
            </>
          )}
        </div>

        {/* Notes */}
        {milestone.notes && !compact && (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 italic">
            "{milestone.notes}"
          </p>
        )}
      </div>

      {/* Footer bar: Staff + Financial Badge + Action Buttons */}
      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5 text-[11px]">
          {milestone.assignedDriverId && (
            <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              🚗 [DRV]
            </span>
          )}
          {milestone.assignedGuideId && (
            <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              🗣️ [GUIA]
            </span>
          )}
          {milestone.assignedNurseId && (
            <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-1.5 py-0.5 font-medium text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              🩺 [NURSE]
            </span>
          )}
          {milestone.financialType !== 'NONE' && !milestone.cost.isZero() && (
            <MoneyDisplay
              money={milestone.cost}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1"
            />
          )}
        </div>

        {/* Action icons / flags */}
        <div className="flex items-center gap-1">
          {milestone.gpsChecked && (
            <span className="text-xs text-emerald-600" title="Check-in GPS verificado">
              📍✅
            </span>
          )}
          {milestone.signatureUuid && (
            <span className="text-xs text-indigo-600" title="Firma digital capturada">
              ✍️✅
            </span>
          )}
          {milestone.receiptUuid && (
            <span className="text-xs text-amber-600" title="Recibo OCR cargado">
              🧾✅
            </span>
          )}

          {/* Quick buttons */}
          {onGpsCheckIn && !milestone.gpsChecked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGpsCheckIn(milestone);
              }}
              className="rounded p-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
              title="Simular Check-in GPS"
            >
              📍 Check-in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
