import React from 'react';
import { useAuth } from './src/hooks/useAuth';
import { Auth } from './src/pages/Auth';
import { Dashboard } from './src/pages/Dashboard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard />;
}