import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function Auth() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = isSignUp ? await signUp(email, password) : await signIn(email, password);
    if (res?.error) {
      setError(
        res.error.message === 'Invalid login credentials'
          ? 'Email ou senha inválidos.'
          : res.error.message === 'User already registered'
            ? 'Este email já está cadastrado.'
            : res.error.message
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-health flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Header com logo */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-2xl opacity-20 blur-2xl scale-150" />
            <div className="relative w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-primary-500/10 flex items-center justify-center">
              <span className="text-4xl animate-float">💉</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
            Gestão de Vacinas
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1.5 max-w-xs mx-auto">
            Proteja sua família com um acompanhamento completo de vacinas
          </p>
        </div>

        {/* Card de autenticação */}
        <div className="card-premium">
          {/* Tabs */}
          <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                !isSignUp
                  ? 'bg-white dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark shadow-sm'
                  : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-secondary-light dark:hover:text-text-secondary-dark'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                isSignUp
                  ? 'bg-white dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark shadow-sm'
                  : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-secondary-light dark:hover:text-text-secondary-dark'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-premium pl-10"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-premium pl-10"
                  placeholder="Sua senha"
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
              {isSignUp && (
                <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-1.5 ml-1">
                  Mínimo de 6 caracteres
                </p>
              )}
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 animate-scale-in">
                <span className="text-sm shrink-0">⚠️</span>
                <p className="text-xs text-danger-700 dark:text-danger-400">{error}</p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processando...
                </span>
              ) : isSignUp ? (
                'Criar Conta'
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-text-muted-light dark:text-text-muted-dark mt-8">
          Ao entrar, você concorda em manter suas crianças vacinadas 💚
        </p>
      </div>
    </div>
  );
}