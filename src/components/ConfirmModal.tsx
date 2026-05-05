import { type ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
  variant?: 'danger' | 'warning';
}

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  icon,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmClass = variant === 'danger'
    ? 'bg-danger-500 hover:bg-danger-600 shadow-md shadow-danger-500/25'
    : 'bg-warning-500 hover:bg-warning-600 shadow-md shadow-warning-500/25';

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
        <div className="text-center">
          {icon && <span className="text-5xl block mb-4">{icon}</span>}
          <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
              {description}
            </p>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onConfirm}
            className={`flex-1 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${confirmClass}`}
          >
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="flex-1 btn-secondary">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
