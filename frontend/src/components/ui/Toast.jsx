import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    classes: 'border-success/30 text-success',
    bar: 'bg-success',
  },
  error: {
    icon: XCircle,
    classes: 'border-danger/30 text-danger',
    bar: 'bg-danger',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-warning/30 text-warning',
    bar: 'bg-warning',
  },
  info: {
    icon: Info,
    classes: 'border-primary/30 text-primary',
    bar: 'bg-primary',
  },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 4200 }) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) => toast({ title, description, variant: 'error' }),
      warning: (title, description) => toast({ title, description, variant: 'warning' }),
      info: (title, description) => toast({ title, description, variant: 'info' }),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const v = VARIANTS[t.variant] || VARIANTS.info;
            const Icon = v.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 32, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card p-4 pr-10 shadow-float"
                role="status"
              >
                <span className={cn('absolute inset-y-0 left-0 w-1', v.bar)} />
                <div className="flex items-start gap-3">
                  <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', v.classes)} />
                  <div className="min-w-0">
                    {t.title && <p className="text-sm font-semibold text-foreground">{t.title}</p>}
                    {t.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
