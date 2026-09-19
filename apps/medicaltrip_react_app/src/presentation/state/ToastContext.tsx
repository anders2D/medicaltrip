/**
 * Medical Trip Colombia S.A.S. - ToastContext
 * Non-blocking optimistic toast notifications provider with 1-click "Deshacer" (Undo)
 * and global Ctrl+Z / Cmd+Z keyboard listener.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  id?: string;
  message: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  undoLatest: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const durationMs = options.durationMs !== undefined ? options.durationMs : 4500;
      const newToast: ToastItem = {
        ...options,
        id,
        type: options.type || 'info',
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }

      return id;
    },
    [dismissToast]
  );

  const undoLatest = useCallback(() => {
    setToasts((prev) => {
      const activeUndo = [...prev].reverse().find((t) => t.onAction);
      if (activeUndo && activeUndo.onAction) {
        try {
          activeUndo.onAction();
        } catch (err) {
          console.error('Error executing toast undo:', err);
        }
        return prev.filter((t) => t.id !== activeUndo.id);
      }
      return prev;
    });
  }, []);

  // Global Ctrl+Z / Cmd+Z Keyboard Shortcut Listener for Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT');

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoLatest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLatest]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, undoLatest }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a fallback no-op context if used outside ToastProvider
    return {
      toasts: [],
      showToast: () => '',
      dismissToast: () => {},
      undoLatest: () => {},
    };
  }
  return context;
};

export interface ToastContainerProps {
  toasts?: ToastItem[];
  onDismiss?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts: propToasts, onDismiss: propOnDismiss }) => {
  const context = useToast();
  const toasts = propToasts ?? context?.toasts ?? [];
  const onDismiss = propOnDismiss ?? context?.dismissToast ?? (() => {});

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      data-testid="toast-container"
      className="fixed bottom-20 md:bottom-16 md:right-6 left-1/2 -translate-x-1/2 md:translate-x-0 z-50 flex flex-col gap-2 pointer-events-none max-w-sm sm:max-w-md w-[calc(100%-2rem)] md:w-auto"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid="toast-notification"
          className="pointer-events-auto bg-zinc-950 text-white px-3.5 py-2.5 rounded-lg border border-zinc-800 shadow-sm flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
          role="alert"
        >
          <div className="flex items-center gap-2 min-w-0">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span className="font-medium text-zinc-100 truncate">{toast.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast.onAction && (
              <button
                type="button"
                data-testid="toast-undo-btn"
                onClick={() => {
                  if (toast.onAction) {
                    toast.onAction();
                  }
                  onDismiss(toast.id);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 duration-200 text-emerald-400 hover:text-emerald-300 font-bold text-xs cursor-pointer transition-colors"
                title="Deshacer última acción (Ctrl+Z / Cmd+Z)"
              >
                <Undo2 className="w-3 h-3" />
                <span>{toast.actionLabel || 'Deshacer'}</span>
              </button>
            )}

            <button
              type="button"
              data-testid="toast-dismiss-btn"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
