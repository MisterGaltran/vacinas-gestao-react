import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm" role="alert" aria-live="polite">
        {toasts.map((toast) => {
          const config = TOAST_CONFIG[toast.type];
          return (
            <div
              key={toast.id}
              className={`animate-slide-up ${config.bg} border ${config.border} rounded-2xl px-4 py-3 flex items-start gap-3 shadow-lg`}
            >
              <span className="text-base shrink-0">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${config.title}`}>{config.label}</p>
                <p className={`text-xs ${config.text} mt-0.5`}>{toast.message}</p>
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className={`${config.dismiss} transition-colors shrink-0 mt-0.5`}
                aria-label="Fechar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const TOAST_CONFIG: Record<ToastType, {
  bg: string; border: string; icon: string; label: string;
  title: string; text: string; dismiss: string;
}> = {
  error: {
    bg: 'bg-danger-50 dark:bg-danger-500/10',
    border: 'border-danger-200 dark:border-danger-500/20',
    icon: '⚠️',
    label: 'Erro',
    title: 'text-danger-700 dark:text-danger-400',
    text: 'text-danger-600 dark:text-danger-300',
    dismiss: 'text-danger-400 hover:text-danger-600 dark:hover:text-danger-300',
  },
  success: {
    bg: 'bg-success-50 dark:bg-success-500/10',
    border: 'border-success-200 dark:border-success-500/20',
    icon: '✅',
    label: 'Sucesso',
    title: 'text-success-700 dark:text-success-400',
    text: 'text-success-600 dark:text-success-300',
    dismiss: 'text-success-400 hover:text-success-600 dark:hover:text-success-300',
  },
  info: {
    bg: 'bg-info-50 dark:bg-info-500/10',
    border: 'border-info-100 dark:border-info-500/20',
    icon: '💡',
    label: 'Info',
    title: 'text-info-600 dark:text-info-500',
    text: 'text-info-600 dark:text-info-500',
    dismiss: 'text-info-500 hover:text-info-600',
  },
};
