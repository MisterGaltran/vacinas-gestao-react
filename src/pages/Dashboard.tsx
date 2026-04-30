import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChildren } from '../hooks/useChildren';
import { useChildrenStats } from '../hooks/useChildrenStats';
import { useVaccines } from '../hooks/useVaccines';
import { Layout } from '../components/Layout';
import { ChildSelector } from '../components/ChildSelector';
import { VaccineCard } from '../components/VaccineCard';
import type { Child, VaccineWithRecord } from '../types';

function groupByMonth(vaccines: VaccineWithRecord[]): Record<string, VaccineWithRecord[]> {
  const groups: Record<string, VaccineWithRecord[]> = {};
  for (const v of vaccines) {
    const monthKey = v.calculated_date.substring(0, 7);
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(v);
  }
  return groups;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${months[parseInt(month) - 1]} de ${year}`;
}

function calculateAgeDisplay(birthDateStr: string): string {
  const birth = new Date(birthDateStr);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  return remaining > 0 ? `${years}a ${remaining}m` : `${years} anos`;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { children, loading: childrenLoading, addChild } = useChildren(user);
  const { statsByChild } = useChildrenStats(children);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // Se selectedChild não existe mais em children (deletado, RLS mudou, etc.),
  // reseta para evitar tela em branco. Reaproveita a referência se o mesmo
  // id continua disponível, mas com dados atualizados.
  useEffect(() => {
    if (!selectedChild) return;
    const fresh = children.find((c) => c.id === selectedChild.id);
    if (!fresh) {
      setSelectedChild(null);
    } else if (fresh !== selectedChild) {
      setSelectedChild(fresh);
    }
  }, [children, selectedChild]);

  const { vaccines, loading: vaccinesLoading, markAsTaken, unmarkVaccine, addCustomVaccine, deleteCustomVaccine } = useVaccines(selectedChild);

  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');

  const [customName, setCustomName] = useState('');
  const [customDisease, setCustomDisease] = useState('');
  const [customAge, setCustomAge] = useState(0);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !childBirthDate) return;

    const { data, error: addError } = await addChild(childName, childBirthDate);
    if (!addError && data) {
      setSelectedChild(data);
      setShowAddChild(false);
      setChildName('');
      setChildBirthDate('');
    }
    if (addError) setError(addError.message);
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customDisease || !customDate) return;

    const { error: addError } = await addCustomVaccine(customName, customDisease, customAge, customDate);
    if (!addError) {
      setShowAddCustom(false);
      setCustomName('');
      setCustomDisease('');
      setCustomAge(0);
      setCustomDate(new Date().toISOString().split('T')[0]);
    }
    if (addError) setError(addError.message);
  };

  const takenCount = vaccines.filter((v) => v.calculated_status === 'taken').length;
  const lateCount = vaccines.filter((v) => v.calculated_status === 'late').length;
  const upcomingCount = vaccines.filter((v) => v.calculated_status === 'upcoming').length;
  const totalCount = vaccines.length;

  const groupedVaccines = groupByMonth(vaccines);

  return (
    <Layout
      title="Gestão de Vacinas"
      onLogout={signOut}
      onBack={selectedChild ? () => setSelectedChild(null) : undefined}
      rightContent={
        children.length > 0 && selectedChild ? (
          <ChildSelector
            children={children}
            selectedChild={selectedChild}
            onSelect={setSelectedChild}
            onAddNew={() => setShowAddChild(true)}
          />
        ) : null
      }
    >
      {/* Error toast flutuante */}
      {error && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-scale-in">
          <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-lg">
            <span className="text-lg shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-danger-700 dark:text-danger-400">Erro</p>
              <p className="text-xs text-danger-600 dark:text-danger-300 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Cards das crianças (home) */}
      {!childrenLoading && children.length > 0 && !selectedChild && (
        <div className="space-y-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xl shadow-md shadow-accent-500/25">
              👨‍👩‍👧
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                Suas Crianças
              </h2>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                {children.length} criança{children.length > 1 ? 's' : ''} cadastrada{children.length > 1 ? 's' : ''} · toque para ver vacinas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {children.map((child) => {
              const stats = statsByChild[child.id];
              const total = stats?.total ?? 0;
              const taken = stats?.taken ?? 0;
              const late = stats?.late ?? 0;
              const upcoming = stats?.upcoming ?? 0;
              const coverage = total > 0 ? Math.round((taken / total) * 100) : 0;
              const ageDisplay = calculateAgeDisplay(child.birth_date);

              return (
                <div
                  key={child.id}
                  className={`card-premium p-5 relative overflow-hidden transition-all duration-300 ${
                    late > 0 ? 'border-l-[3px] border-l-danger-500' : 'border-l-[3px] border-l-primary-400'
                  }`}
                >
                  {/* Header: foto + nome + idade + ações */}
                  <div className="flex items-start gap-4 mb-4">
                    {child.photo_url ? (
                      <img
                        src={child.photo_url}
                        alt={child.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-gray-700 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-3xl shadow-md shrink-0">
                        👶
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-extrabold text-text-primary-light dark:text-text-primary-dark truncate">
                        {child.name}
                      </h3>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                        🎂 {new Date(child.birth_date).toLocaleDateString('pt-BR')} · {ageDisplay}
                      </p>
                      {child.maternity && (
                        <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark mt-0.5 truncate">
                          🏥 {child.maternity}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/child/${child.id}`);
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary-50 dark:hover:bg-primary-500/15 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-all shrink-0"
                      title="Editar perfil"
                      aria-label="Editar perfil"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  {/* Stats: 3 colunas */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-success-50 dark:bg-success-500/10 rounded-xl px-3 py-2.5 text-center border border-success-100 dark:border-success-500/20">
                      <div className="text-lg font-extrabold text-success-600 dark:text-green-400 tabular-nums leading-tight">
                        {taken}
                      </div>
                      <p className="text-[9px] font-semibold text-success-600 dark:text-green-400 uppercase tracking-wider mt-0.5">
                        ✅ Tomadas
                      </p>
                    </div>
                    <div className={`rounded-xl px-3 py-2.5 text-center border ${
                      late > 0
                        ? 'bg-danger-50 dark:bg-danger-500/10 border-danger-100 dark:border-danger-500/20'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-border-light dark:border-border-dark'
                    }`}>
                      <div className={`text-lg font-extrabold tabular-nums leading-tight ${
                        late > 0 ? 'text-danger-600 dark:text-red-400' : 'text-text-muted-light dark:text-text-muted-dark'
                      }`}>
                        {late}
                      </div>
                      <p className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${
                        late > 0 ? 'text-danger-600 dark:text-red-400' : 'text-text-muted-light dark:text-text-muted-dark'
                      }`}>
                        🔴 Atrasadas
                      </p>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-500/10 rounded-xl px-3 py-2.5 text-center border border-primary-100 dark:border-primary-500/20">
                      <div className="text-lg font-extrabold text-primary-600 dark:text-blue-400 tabular-nums leading-tight">
                        {upcoming}
                      </div>
                      <p className="text-[9px] font-semibold text-primary-600 dark:text-blue-400 uppercase tracking-wider mt-0.5">
                        🔜 Próximas
                      </p>
                    </div>
                  </div>

                  {/* Cobertura */}
                  {total > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                          Cobertura ({taken}/{total})
                        </span>
                        <span className="font-bold text-success-600 dark:text-green-400 tabular-nums">
                          {coverage}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${coverage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedChild(child)}
                      className="btn-primary flex-1 text-xs !py-2"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Ver vacinas
                      </span>
                    </button>
                    <button
                      onClick={() => navigate(`/child/${child.id}`)}
                      className="btn-secondary text-xs !py-2 !px-3"
                      title="Perfil completo"
                    >
                      Perfil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!showAddChild && (
            <div className="text-center pt-4 pb-2">
              <button onClick={() => setShowAddChild(true)} className="btn-ghost text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Cadastrar nova criança
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sem crianças cadastradas */}
      {!childrenLoading && children.length === 0 && !showAddChild && (
        <div className="text-center py-20 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full opacity-20 blur-2xl scale-150" />
            <span className="relative text-7xl animate-float block">👶</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-8">
            Nenhuma criança cadastrada
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 max-w-sm mx-auto">
            Cadastre uma criança para começar a acompanhar as vacinas e manter sua família protegida.
          </p>
          <button
            onClick={() => setShowAddChild(true)}
            className="btn-primary mt-8"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Cadastrar Criança
            </span>
          </button>
        </div>
      )}

      {/* Formulário de adicionar criança */}
      {showAddChild && (
        <div className="card-premium mb-8 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg shadow-md shadow-primary-500/25">
              👶
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                Cadastrar Criança
              </h3>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                Preencha os dados para começar o acompanhamento
              </p>
            </div>
          </div>

          <form onSubmit={handleAddChild} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                  className="input-premium"
                  placeholder="Nome da criança"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={childBirthDate}
                  onChange={(e) => setChildBirthDate(e.target.value)}
                  required
                  className="input-premium"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary">
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowAddChild(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard com dados (criança selecionada) */}
      {selectedChild && (
        <div className="animate-fade-in-up">
          {/* Cabeçalho da criança selecionada com botão de perfil */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              {selectedChild.photo_url ? (
                <img
                  src={selectedChild.photo_url}
                  alt={selectedChild.name}
                  className="w-11 h-11 rounded-xl object-cover border-2 border-white dark:border-gray-700 shadow-md shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xl shadow-md shrink-0">
                  👶
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-text-primary-light dark:text-text-primary-dark truncate">
                  {selectedChild.name}
                </h2>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  🎂 {calculateAgeDisplay(selectedChild.birth_date)}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/child/${selectedChild.id}`)}
              className="btn-secondary text-xs !py-2 !px-3 shrink-0"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Perfil
              </span>
            </button>
          </div>

          {/* Painel de Estatísticas Premium */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="card-stat border-t-[3px] border-t-primary-400 hover:border-t-primary-500">
              <div className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark mb-1 tabular-nums">
                {totalCount}
              </div>
              <p className="text-[11px] font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                Total de Vacinas
              </p>
              <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-1 truncate">
                {selectedChild.name}
              </p>
            </div>

            <div className="card-stat border-t-[3px] border-t-success-500 hover:border-t-success-600 before:from-success-400 before:to-success-500">
              <div className="relative inline-block mb-1">
                <div className="absolute inset-0 bg-success-400/20 rounded-full blur-md" />
                <span className="relative text-3xl font-extrabold text-success-600 dark:text-green-400 tabular-nums">
                  {takenCount}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-success-600 dark:text-green-400 uppercase tracking-wider">
                ✅ Tomadas
              </p>
            </div>

            <div className={`card-stat border-t-[3px] border-t-danger-500 hover:border-t-danger-600 before:from-danger-400 before:to-danger-500 ${lateCount > 0 ? 'animate-pulse' : ''}`}>
              <div className="relative inline-block mb-1">
                {lateCount > 0 && (
                  <div className="absolute inset-0 bg-danger-400/20 rounded-full blur-md animate-pulse" />
                )}
                <span className="relative text-3xl font-extrabold text-danger-600 dark:text-red-400 tabular-nums">
                  {lateCount}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-danger-600 dark:text-red-400 uppercase tracking-wider">
                🔴 Atrasadas
              </p>
            </div>

            <div className="card-stat border-t-[3px] border-t-primary-400 hover:border-t-primary-500 before:from-primary-400 before:to-primary-500">
              <div className="text-3xl font-extrabold text-primary-600 dark:text-blue-400 mb-1 tabular-nums">
                {upcomingCount}
              </div>
              <p className="text-[11px] font-semibold text-primary-600 dark:text-blue-400 uppercase tracking-wider">
                🔜 Próximas
              </p>
              <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-1">
                Em até 30 dias
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          {totalCount > 0 && (
            <div className="card-premium mb-8 !p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Cobertura Vacinal
                </span>
                <span className="text-xs font-bold text-success-600 dark:text-green-400">
                  {Math.round((takenCount / totalCount) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(takenCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Calendário por mês */}
          {vaccinesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-premium animate-shimmer">
                  <div className="skeleton h-4 w-32 mb-4" />
                  <div className="space-y-3">
                    <div className="skeleton h-16 w-full" />
                    <div className="skeleton h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedVaccines).map(([monthKey, monthVaccines], groupIndex) => (
                <div key={monthKey} className="animate-fade-in-up" style={{ animationDelay: `${groupIndex * 80}ms` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-primary-500/20">
                      {monthKey.split('-')[1]}
                    </div>
                    <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                      {formatMonthLabel(monthKey)}
                    </h3>
                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      {monthVaccines.length} vacina{monthVaccines.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {monthVaccines.map((vaccine) => (
                      <VaccineCard
                        key={vaccine.id}
                        vaccine={vaccine}
                        onMarkTaken={async (vid, date, notes) => {
                          const { error: markError } = await markAsTaken(vid, date, notes || undefined);
                          if (markError) setError(markError.message);
                        }}
                        onUnmark={async (recordId) => {
                          const { error: unmarkError } = await unmarkVaccine(recordId);
                          if (unmarkError) setError(unmarkError.message);
                        }}
                        onDeleteCustom={vaccine.is_custom ? async (vid) => {
                          const { error: delError } = await deleteCustomVaccine(vid);
                          if (delError) setError(delError.message);
                        } : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(groupedVaccines).length === 0 && (
                <div className="text-center py-16">
                  <span className="text-5xl block mb-4">📋</span>
                  <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Nenhuma vacina encontrada
                  </p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                    Adicione uma vacina extra ou verifique os dados da criança.
                  </p>
                </div>
              )}

              {/* Botão adicionar vacina extra */}
              <div className="text-center pt-6 border-t-2 border-dashed border-border-light dark:border-border-dark">
                <button
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="btn-ghost text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    {showAddCustom ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancelar
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar vacina extra
                      </>
                    )}
                  </span>
                </button>

                {showAddCustom && (
                  <form
                    onSubmit={handleAddCustom}
                    className="mt-6 card-premium text-left space-y-4 animate-scale-in"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shadow-md shadow-accent-500/20">
                        ⭐
                      </div>
                      <h4 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                        Nova Vacina Extra
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                          Nome da vacina
                        </label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          required
                          className="input-premium"
                          placeholder="Ex: Dengue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                          Doença prevenida
                        </label>
                        <input
                          type="text"
                          value={customDisease}
                          onChange={(e) => setCustomDisease(e.target.value)}
                          required
                          className="input-premium"
                          placeholder="Ex: Dengue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                          Idade recomendada (meses)
                        </label>
                        <input
                          type="number"
                          value={customAge}
                          onChange={(e) => setCustomAge(parseInt(e.target.value) || 0)}
                          className="input-premium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                          Data prevista
                        </label>
                        <input
                          type="date"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          required
                          className="input-premium"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="btn-primary">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Adicionar
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCustom(false)}
                        className="btn-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
