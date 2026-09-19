import React from 'react';

export interface DragDropGhostProps {
  snappedStartTime: string;
  snappedEndTime: string;
  durationMinutes: number;
  topPx: number;
  heightPx: number;
  widthPct?: number;
  leftPct?: number;
}

export const DragDropGhost: React.FC<DragDropGhostProps> = ({
  snappedStartTime,
  snappedEndTime,
  durationMinutes,
  topPx,
  heightPx,
  widthPct = 100,
  leftPct = 0,
}) => {
  return (
    <div
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
      }}
      className="pointer-events-none absolute z-30 flex flex-col justify-between rounded-lg border-2 border-dashed border-sky-500 bg-sky-100/70 p-2.5 shadow-md backdrop-blur-[1px] transition-all dark:bg-sky-950/60"
      data-testid="drag-drop-ghost"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-sky-900 dark:text-sky-200">
          🕒 {snappedStartTime} – {snappedEndTime}
        </span>
        <span className="rounded bg-sky-200 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-800 dark:bg-sky-900 dark:text-sky-100">
          Snap: 15 min ({durationMinutes}m)
        </span>
      </div>
      <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
        Soltar para reagendar hito clínico
      </div>
    </div>
  );
};
