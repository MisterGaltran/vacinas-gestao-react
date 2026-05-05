interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ProgressRing({ percentage, size = 100, strokeWidth = 8, label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  // Cor baseada na porcentagem
  const color =
    percentage >= 80 ? 'stroke-success-500' :
    percentage >= 50 ? 'stroke-warning-500' :
    'stroke-primary-500';

  const textColor =
    percentage >= 80 ? 'text-success-600 dark:text-green-400' :
    percentage >= 50 ? 'text-warning-600 dark:text-amber-400' :
    'text-primary-600 dark:text-primary-400';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-100 dark:stroke-gray-700"
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`${color} animate-ring-fill`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            ['--ring-circumference' as string]: circumference,
            ['--ring-offset' as string]: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-extrabold ${textColor} tabular-nums`}>
          {Math.round(percentage)}%
        </span>
        {label && (
          <span className="text-[11px] font-medium text-text-muted-light dark:text-text-muted-dark mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
