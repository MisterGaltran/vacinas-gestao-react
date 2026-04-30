import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Lazy: ChildProfile só é baixado quando o usuário navega para /child/:id
const ChildProfile = lazy(() =>
  import('./pages/ChildProfile').then((m) => ({ default: m.ChildProfile }))
);

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center animate-scale-in">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full animate-pulse opacity-30" />
            <div className="absolute inset-2 bg-surface-light dark:bg-surface-dark rounded-full flex items-center justify-center">
              <span className="text-2xl animate-float">💉</span>
            </div>
          </div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-5 font-medium">
            Preparando seu painel...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/child/:id" element={<ChildProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <PWAInstallPrompt />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/vacinas-gestao-react">
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
