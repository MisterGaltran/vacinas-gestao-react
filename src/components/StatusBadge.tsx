import type { VaccineStatus } from '../types';

interface StatusBadgeProps {
  status: VaccineStatus;
}

const STATUS_CONFIG: Record<VaccineStatus, {
  emoji: string;
  label: string;
  classes: string;
  darkClasses: string;
  glowClass: string;
}> = {
  taken: {
    emoji: '✅',
    label: 'Tomada',
    classes: 'bg-success-100 text-success-700 border-success-200',
    darkClasses: 'dark:bg-success-500/15 dark:text-emerald-300 dark:border-emerald-500/25',
    glowClass: 'shadow-[0_0_10px_rgba(34,197,94,0.12)]',
  },
  pending: {
    emoji: '⏳',
    label: 'Pendente',
    classes: 'bg-warning-100 text-warning-600 border-warning-200',
    darkClasses: 'dark:bg-warning-500/15 dark:text-amber-300 dark:border-amber-500/25',
    glowClass: '',
  },
  late: {
    emoji: '🔴',
    label: 'Atrasada',
    classes: 'bg-danger-100 text-danger-700 border-danger-200',
    darkClasses: 'dark:bg-danger-500/15 dark:text-rose-300 dark:border-rose-500/25',
    glowClass: 'shadow-[0_0_12px_rgba(239,68,68,0.15)]',
  },
  upcoming: {
    emoji: '🔜',
    label: 'Proxima',
    classes: 'bg-primary-100 text-primary-700 border-primary-200',
    darkClasses: 'dark:bg-primary-500/15 dark:text-rose-300 dark:border-rose-500/25',
    glowClass: '',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-wide transition-all duration-300 ${config.classes} ${config.darkClasses} ${config.glowClass}`}
    >
      <span className="text-xs leading-none">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
