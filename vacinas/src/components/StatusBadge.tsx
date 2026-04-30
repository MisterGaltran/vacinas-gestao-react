import type { VaccineStatus } from '../types';

interface StatusBadgeProps {
  status: VaccineStatus;
}

const STATUS_CONFIG: Record<VaccineStatus, {
  emoji: string;
  label: string;
  classes: string;
  glowClass: string;
}> = {
  taken: {
    emoji: '✅',
    label: 'Tomada',
    classes: 'bg-success-100 text-success-700 border-success-200',
    glowClass: 'shadow-[0_0_12px_rgba(34,197,94,0.15)]',
  },
  pending: {
    emoji: '⏳',
    label: 'Pendente',
    classes: 'bg-warning-100 text-warning-600 border-warning-200',
    glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.1)]',
  },
  late: {
    emoji: '🔴',
    label: 'Atrasada',
    classes: 'bg-danger-100 text-danger-700 border-danger-200',
    glowClass: 'shadow-[0_0_16px_rgba(239,68,68,0.2)]',
  },
  upcoming: {
    emoji: '🔜',
    label: 'Próxima',
    classes: 'bg-primary-100 text-primary-700 border-primary-200',
    glowClass: 'shadow-[0_0_12px_rgba(59,130,246,0.15)]',
  },
};

const STATUS_DARK: Record<VaccineStatus, string> = {
  taken: 'dark:bg-success-500/15 dark:text-green-400 dark:border-green-500/20',
  pending: 'dark:bg-warning-500/15 dark:text-amber-400 dark:border-amber-500/20',
  late: 'dark:bg-danger-500/15 dark:text-red-400 dark:border-red-500/20',
  upcoming: 'dark:bg-primary-500/15 dark:text-blue-400 dark:border-blue-500/20',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const darkClasses = STATUS_DARK[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-wide transition-all duration-300 ${config.classes} ${darkClasses} ${config.glowClass}`}
    >
      <span className="text-xs leading-none">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}