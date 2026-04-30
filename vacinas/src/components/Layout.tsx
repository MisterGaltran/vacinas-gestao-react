import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title: string;
  onLogout?: () => void;
  rightContent?: ReactNode;
}

export function Layout({ children, title, onLogout, rightContent }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💉</span>
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {rightContent}
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
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
    </div>
  );
}