import type { VaccineStatus } from '../types';
import { STATUS_COLORS } from '../types';

interface StatusBadgeProps {
  status: VaccineStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
    >
      {color.icon} {color.label}
    </span>
  );
}