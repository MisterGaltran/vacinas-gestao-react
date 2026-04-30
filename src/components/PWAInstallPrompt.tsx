import { useEffect, useState } from 'react';

const STORAGE_KEY = 'vacinas-ios-install-dismissed';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari: navigator.standalone | Android Chrome: display-mode
  return (
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIOS() || isInStandaloneMode()) return;
    if (localStorage.getItem(STORAGE_KEY) === '1') return;
    // Mostra após pequeno delay para não atrapalhar o load
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-fade-in-up">
      <div className="card-premium !p-4 shadow-2xl border-2 border-primary-200 dark:border-primary-500/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xl shrink-0">
            📲
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
              Instalar na tela inicial
            </h4>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 leading-relaxed">
              Toque em <span className="inline-block px-1 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono">⎋</span> Compartilhar e depois em <strong>"Adicionar à Tela de Início"</strong>.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
