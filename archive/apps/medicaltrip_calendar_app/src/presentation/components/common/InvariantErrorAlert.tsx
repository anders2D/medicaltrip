import React from 'react';

export interface InvariantErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

export const InvariantErrorAlert: React.FC<InvariantErrorAlertProps> = ({
  error,
  onDismiss,
  className = '',
}) => {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 ${className}`}
      data-testid="invariant-error-alert"
    >
      <div className="flex-shrink-0 text-base" aria-hidden="true">
        🚫
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-rose-950 dark:text-rose-100">
          Invariante de Dominio / Error Geoespacial
        </h4>
        <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300 font-mono">
          {error}
        </p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 text-xs font-semibold p-1"
          aria-label="Cerrar alerta"
        >
          ✕
        </button>
      )}
    </div>
  );
};
