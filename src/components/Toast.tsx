import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ReactNode; bar: string }> = {
  success: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, bar: 'border-l-4 border-emerald-500' },
  error: { icon: <XCircle className="w-5 h-5 text-rose-400" />, bar: 'border-l-4 border-rose-500' },
  warning: { icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, bar: 'border-l-4 border-amber-500' },
  info: { icon: <Info className="w-5 h-5 text-indigo-400" />, bar: 'border-l-4 border-indigo-500' },
};

const AUTO_DISMISS_MS = 3500;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      timers.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Stacked bottom-center snackbars, positioned above the mobile BottomNav */}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto w-full max-w-sm bg-slate-900 text-white rounded-lg shadow-2xl px-3 py-2.5 flex items-center gap-2.5 ${style.bar} animate-in slide-in-from-bottom-2 fade-in duration-200`}
            >
              {style.icon}
              <p className="flex-1 text-xs font-semibold leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="p-1 text-slate-400 hover:text-white rounded transition shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
