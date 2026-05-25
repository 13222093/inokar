import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, opts?: { kind?: ToastKind; action?: Toast['action']; duration?: number }) => string;
  dismiss: (id: string) => void;
  success: (message: string, opts?: Omit<Parameters<ToastContextValue['toast']>[1], 'kind'>) => string;
  error: (message: string, opts?: Omit<Parameters<ToastContextValue['toast']>[1], 'kind'>) => string;
  info: (message: string, opts?: Omit<Parameters<ToastContextValue['toast']>[1], 'kind'>) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>((message, opts = {}) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newToast: Toast = { id, kind: opts.kind || 'info', message, action: opts.action };
    setToasts(prev => [...prev, newToast]);
    const duration = opts.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const success: ToastContextValue['success'] = useCallback((m, o) => toast(m, { ...o, kind: 'success' }), [toast]);
  const error: ToastContextValue['error'] = useCallback((m, o) => toast(m, { ...o, kind: 'error', duration: o?.duration ?? 7000 }), [toast]);
  const info: ToastContextValue['info'] = useCallback((m, o) => toast(m, { ...o, kind: 'info' }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, info }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const kindStyles: Record<ToastKind, { container: string; icon: string; iconName: string }> = {
  success: {
    container: 'bg-tertiary/10 border-tertiary/30 text-tertiary',
    icon: 'text-tertiary',
    iconName: 'check_circle',
  },
  error: {
    container: 'bg-error/10 border-error/30 text-error',
    icon: 'text-error',
    iconName: 'error',
  },
  info: {
    container: 'bg-primary/10 border-primary/30 text-primary',
    icon: 'text-primary',
    iconName: 'info',
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const styles = kindStyles[toast.kind];

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 10);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-md transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
      } ${styles.container}`}
      role="status"
    >
      <span className={`material-symbols-outlined ${styles.icon} flex-shrink-0`}>{styles.iconName}</span>
      <div className="flex-1 text-sm font-semibold text-on-surface leading-snug">
        {toast.message}
        {toast.action && (
          <button
            onClick={() => { toast.action!.onClick(); onDismiss(); }}
            className={`block mt-1.5 text-xs font-bold underline ${styles.icon} hover:opacity-80`}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-outline hover:text-on-surface transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
};

const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
};
