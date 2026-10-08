'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastTone = 'good' | 'bad' | 'warn' | 'brand';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, tone = 'brand', durationMs = 4000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, title, description, tone, durationMs };

      setToasts((current) => [...current, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Toast Render Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const toneClass = {
            good: 'border-good/30 bg-good-soft text-good',
            bad: 'border-bad/30 bg-bad-soft text-bad',
            warn: 'border-warn/30 bg-warn-soft text-warn',
            brand: 'border-brand/30 bg-brand-soft text-brand',
          }[toast.tone ?? 'brand'];

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start justify-between rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-2 ${toneClass}`}
            >
              <div className="pr-2">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs opacity-90">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="rounded p-1 text-xs opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
