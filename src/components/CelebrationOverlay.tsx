import { useEffect, useState } from 'react';

interface CelebrationOverlayProps {
  show: boolean;
  message?: string;
  onDone?: () => void;
}

const CONFETTI_COLORS = ['#f43f5e', '#a855f7', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];

export function CelebrationOverlay({ show, message = 'Vacina registrada!', onDone }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; color: string; delay: number; size: number }>>([]);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const newParticles = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.8,
      size: 6 + Math.random() * 6,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="confetti-container">
      {/* Confetti */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
          }}
        />
      ))}

      {/* Centro: checkmark + mensagem */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101]">
        <div className="animate-celebration bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-success-200 dark:border-success-500/30 text-center max-w-[240px]">
          <div className="w-14 h-14 mx-auto mb-3 bg-success-100 dark:bg-success-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-success-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path className="animate-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
            {message}
          </p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
            Parabens, mami! 💪
          </p>
        </div>
      </div>
    </div>
  );
}
