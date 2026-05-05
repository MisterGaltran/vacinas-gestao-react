import { type ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  title: string;
  onBack?: () => void;
  onLogout?: () => void;
  rightContent?: ReactNode;
}

export function Layout({ children, title, onBack, onLogout, rightContent }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-health transition-colors duration-300">
      {/* Header Premium com glassmorphism */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border-light dark:border-border-dark">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-primary-50 dark:hover:bg-white/10 transition-colors text-text-secondary-light dark:text-text-secondary-dark"
                aria-label="Voltar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {/* Logo: escudo protecao */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full opacity-20 blur-sm" />
              <div className="relative w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/25">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark truncate max-w-[160px] sm:max-w-xs">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rightContent}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-primary-50 dark:hover:bg-white/10 group"
              title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {/* Icone sol */}
              <svg
                className={`w-4 h-4 absolute transition-all duration-500 ${
                  theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
                } text-amber-500`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>

              {/* Icone lua */}
              <svg
                className={`w-4 h-4 absolute transition-all duration-500 ${
                  theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                } text-primary-400`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark hover:text-danger-500 dark:hover:text-danger-400 transition-colors bg-black/5 dark:bg-white/5 hover:bg-danger-50 dark:hover:bg-danger-500/10 px-3 py-1.5 rounded-lg"
                aria-label="Sair da conta"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 pb-8 pt-2 text-center">
        <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark">
          Caderneta Digital — Protegendo quem voce mais ama 💗
        </p>
      </footer>
    </div>
  );
}
