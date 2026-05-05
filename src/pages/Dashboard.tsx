import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChildren } from '../hooks/useChildren';
import { useChildrenStats } from '../hooks/useChildrenStats';
import { useVaccines } from '../hooks/useVaccines';
import { Layout } from '../components/Layout';
import { ChildSelector } from '../components/ChildSelector';
import { VaccineCard } from '../components/VaccineCard';
import { ProgressRing } from '../components/ProgressRing';
import { useToast } from '../components/Toast';
import type { VaccineWithRecord, VaccineStatus } from '../types';

type FilterStatus = 'all' | VaccineStatus;

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
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
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

function getNextVaccine(vaccines: VaccineWithRecord[]): VaccineWithRecord | null {
  const upcoming = vaccines
    .filter((v) => v.calculated_status === 'upcoming' || v.calculated_status === 'late')
    .sort((a, b) => a.calculated_date.localeCompare(b.calculated_date));
  return upcoming[0] || null;
}

function daysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const FILTER_OPTIONS: { value: FilterStatus; label: string; emoji: string }[] = [
  { value: 'all', label: 'Todas', emoji: '📋' },
  { value: 'late', label: 'Atrasadas', emoji: '🔴' },
  { value: 'upcoming', label: 'Proximas', emoji: '🔜' },
  { value: 'pending', label: 'Pendentes', emoji: '⏳' },
  { value: 'taken', label: 'Tomadas', emoji: '✅' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { children, loading: childrenLoading, addChild } = useChildren(user);
  const { statsByChild } = useChildrenStats(children);
  const { showToast } = useToast();

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const selectedChild = selectedChildId
    ? children.find((c) => c.id === selectedChildId) ?? null
    : null;

  const { vaccines, loading: vaccinesLoading, markAsTaken, unmarkVaccine, addCustomVaccine, deleteCustomVaccine } = useVaccines(selectedChild);

  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');

  const [customName, setCustomName] = useState('');
  const [customDisease, setCustomDisease] = useState('');
  const [customAge, setCustomAge] = useState(0);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  // Filtros e busca
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !childBirthDate) return;

    const { data, error: addError } = await addChild(childName, childBirthDate);
    if (!addError && data) {
      setSelectedChildId(data.id);
      setShowAddChild(false);
      setChildName('');
      setChildBirthDate('');
      showToast(`${childName} cadastrada com sucesso!`, 'success');
    }
    if (addError) showToast(addError.message);
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
      showToast(`${customName} adicionada!`, 'success');
    }
    if (addError) showToast(addError.message);
  };

  const takenCount = vaccines.filter((v) => v.calculated_status === 'taken').length;
  const lateCount = vaccines.filter((v) => v.calculated_status === 'late').length;
  const upcomingCount = vaccines.filter((v) => v.calculated_status === 'upcoming').length;
  const totalCount = vaccines.length;
  const coverage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Vacinas filtradas
  const filteredVaccines = useMemo(() => {
    let result = vaccines;
    if (filter !== 'all') {
      result = result.filter((v) => v.calculated_status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) => v.name.toLowerCase().includes(q) || v.disease.toLowerCase().includes(q)
      );
    }
    return result;
  }, [vaccines, filter, search]);

  const groupedVaccines = useMemo(() => groupByMonth(filteredVaccines), [filteredVaccines]);

  return (
    <Layout
      title="Caderneta Digital"
      onLogout={signOut}
      onBack={selectedChild ? () => setSelectedChildId(null) : undefined}
      rightContent={
        children.length > 0 && selectedChild ? (
          <ChildSelector
            children={children}
            selectedChild={selectedChild}
            onSelect={(c) => setSelectedChildId(c.id)}
            onAddNew={() => setShowAddChild(true)}
          />
        ) : null
      }
    >
      {/* Cards das criancas (home) */}
      {!childrenLoading && children.length > 0 && !selectedChild && (
        <div className="space-y-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xl shadow-md shadow-primary-500/25">
              👨‍👩‍👧
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                Suas Criancas
              </h2>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                {children.length} crianca{children.length > 1 ? 's' : ''} cadastrada{children.length > 1 ? 's' : ''} · toque para ver vacinas
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
              const childCoverage = total > 0 ? Math.round((taken / total) * 100) : 0;
              const ageDisplay = calculateAgeDisplay(child.birth_date);

              return (
                <div
                  key={child.id}
                  className={`card-premium p-5 relative overflow-hidden transition-all duration-300 ${
                    late > 0 ? 'border-l-[3px] border-l-danger-500' : 'border-l-[3px] border-l-primary-400'
                  }`}
                >
                  {/* Header: foto + nome + idade + acoes */}
                  <div className="flex items-start gap-4 mb-4">
                    {child.photo_url ? (
                      <img
                        src={child.photo_url}
                        alt={child.name}
                        loading="lazy"
                        decoding="async"
                        width={64}
                        height={64}
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
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-white/5 hover:bg-primary-100 dark:hover:bg-primary-500/15 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-all shrink-0"
                      title="Editar perfil"
                      aria-label={`Editar perfil de ${child.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  {/* Stats: 3 colunas */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-success-50 dark:bg-success-500/10 rounded-xl px-3 py-2.5 text-center border border-success-100 dark:border-success-500/20">
                      <div className="text-lg font-extrabold text-success-600 dark:text-emerald-300 tabular-nums leading-tight">
                        {taken}
                      </div>
                      <p className="text-[11px] font-semibold text-success-600 dark:text-emerald-300 uppercase tracking-wider mt-0.5">
                        ✅ Tomadas
                      </p>
                    </div>
                    <div className={`rounded-xl px-3 py-2.5 text-center border ${
                      late > 0
                        ? 'bg-danger-50 dark:bg-danger-500/10 border-danger-100 dark:border-danger-500/20'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-border-light dark:border-border-dark'
                    }`}>
                      <div className={`text-lg font-extrabold tabular-nums leading-tight ${
                        late > 0 ? 'text-danger-600 dark:text-rose-300' : 'text-text-muted-light dark:text-text-muted-dark'
                      }`}>
                        {late}
                      </div>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider mt-0.5 ${
                        late > 0 ? 'text-danger-600 dark:text-rose-300' : 'text-text-muted-light dark:text-text-muted-dark'
                      }`}>
                        🔴 Atrasadas
                      </p>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-500/10 rounded-xl px-3 py-2.5 text-center border border-primary-100 dark:border-primary-500/20">
                      <div className="text-lg font-extrabold text-primary-600 dark:text-rose-300 tabular-nums leading-tight">
                        {upcoming}
                      </div>
                      <p className="text-[11px] font-semibold text-primary-600 dark:text-rose-300 uppercase tracking-wider mt-0.5">
                        🔜 Proximas
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
                        <span className="font-bold text-success-600 dark:text-emerald-300 tabular-nums">
                          {childCoverage}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${childCoverage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Acoes */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedChildId(child.id)}
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
                  Cadastrar nova crianca
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sem criancas — onboarding acolhedor */}
      {!childrenLoading && children.length === 0 && !showAddChild && (
        <div className="text-center py-16 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full opacity-20 blur-2xl scale-150" />
            <span className="relative text-7xl animate-float block">👶</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-8">
            Que bom ter voce aqui! 💗
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 max-w-sm mx-auto leading-relaxed">
            Vamos comecar cadastrando seu bebe para acompanhar todas as vacinas direitinho.
          </p>

          {/* 3 passos visuais */}
          <div className="flex items-center justify-center gap-6 mt-8 max-w-md mx-auto">
            <div className="text-center flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">1️⃣</span>
              </div>
              <p className="text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark">Cadastre seu bebe</p>
            </div>
            <div className="text-text-muted-light dark:text-text-muted-dark text-xs">→</div>
            <div className="text-center flex-1">
              <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-500/15 flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">2️⃣</span>
              </div>
              <p className="text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark">Registre as vacinas</p>
            </div>
            <div className="text-text-muted-light dark:text-text-muted-dark text-xs">→</div>
            <div className="text-center flex-1">
              <div className="w-10 h-10 rounded-xl bg-accent-400/15 dark:bg-accent-400/15 flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">3️⃣</span>
              </div>
              <p className="text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark">Fique em dia!</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddChild(true)}
            className="btn-primary mt-8"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Cadastrar meu bebe
            </span>
          </button>
        </div>
      )}

      {/* Formulario de adicionar crianca */}
      {showAddChild && (
        <div className="card-premium mb-8 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg shadow-md shadow-primary-500/25">
              👶
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                Cadastrar Crianca
              </h3>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                Preencha os dados para comecar o acompanhamento
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
                  placeholder="Nome da crianca"
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

      {/* Dashboard com dados (crianca selecionada) */}
      {selectedChild && (
        <div className="animate-fade-in-up">
          {/* Botao voltar */}
          <button
            onClick={() => setSelectedChildId(null)}
            className="btn-ghost text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium mb-3 -ml-2"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {children.length > 1 ? 'Todas as criancas' : 'Voltar'}
            </span>
          </button>

          {/* Cabecalho da crianca com foto + perfil */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              {selectedChild.photo_url ? (
                <img
                  src={selectedChild.photo_url}
                  alt={selectedChild.name}
                  loading="lazy"
                  decoding="async"
                  width={44}
                  height={44}
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

          {/* Cobertura com Progress Ring + proxima vacina */}
          <div className="card-premium mb-6 !p-5">
            <div className="flex items-center gap-6">
              {/* Ring */}
              <ProgressRing
                percentage={coverage}
                size={90}
                strokeWidth={7}
                label="cobertura"
              />

              {/* Info lateral */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">
                  Cobertura Vacinal
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {takenCount} de {totalCount} vacinas tomadas
                </p>

                {/* Proxima vacina em destaque */}
                {(() => {
                  const next = getNextVaccine(vaccines);
                  if (!next) return null;
                  const days = daysUntil(next.calculated_date);
                  const isOverdue = days < 0;
                  return (
                    <div className={`mt-3 px-3 py-2 rounded-xl text-xs ${
                      isOverdue
                        ? 'bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-500/20'
                        : 'bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20'
                    }`}>
                      <p className={`font-semibold ${isOverdue ? 'text-danger-700 dark:text-rose-300' : 'text-primary-700 dark:text-rose-300'}`}>
                        {isOverdue ? '⚠️ Atrasada' : '📅 Proxima'}: {next.name}
                        {next.total_doses > 1 && ` (${next.dose_number}a dose)`}
                      </p>
                      <p className={`mt-0.5 ${isOverdue ? 'text-danger-600 dark:text-rose-200' : 'text-primary-600 dark:text-rose-200'}`}>
                        {isOverdue
                          ? `${Math.abs(days)} dias atrasada`
                          : days === 0 ? 'Hoje!' : `Em ${days} dias`
                        }
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Stats 4 colunas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="card-stat border-t-[3px] border-t-primary-400 hover:border-t-primary-500">
              <div className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark mb-1 tabular-nums">
                {totalCount}
              </div>
              <p className="text-[11px] font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                Total
              </p>
            </div>

            <div className="card-stat border-t-[3px] border-t-success-500 hover:border-t-success-600">
              <div className="text-2xl font-extrabold text-success-600 dark:text-emerald-300 mb-1 tabular-nums">
                {takenCount}
              </div>
              <p className="text-[11px] font-semibold text-success-600 dark:text-emerald-300 uppercase tracking-wider">
                ✅ Tomadas
              </p>
            </div>

            <div className="card-stat border-t-[3px] border-t-danger-500 hover:border-t-danger-600">
              <div className="relative inline-block mb-1">
                {lateCount > 0 && (
                  <div className="absolute -top-1 -right-2">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-danger-500" />
                    </span>
                  </div>
                )}
                <span className="text-2xl font-extrabold text-danger-600 dark:text-rose-300 tabular-nums">
                  {lateCount}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-danger-600 dark:text-rose-300 uppercase tracking-wider">
                🔴 Atrasadas
              </p>
            </div>

            <div className="card-stat border-t-[3px] border-t-primary-400 hover:border-t-primary-500">
              <div className="text-2xl font-extrabold text-primary-600 dark:text-rose-300 mb-1 tabular-nums">
                {upcomingCount}
              </div>
              <p className="text-[11px] font-semibold text-primary-600 dark:text-rose-300 uppercase tracking-wider">
                🔜 Proximas
              </p>
            </div>
          </div>

          {/* Filtros + Busca */}
          <div className="mb-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar vacina ou doenca..."
                className="input-premium !pl-10 text-xs"
                aria-label="Buscar vacinas"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light hover:text-text-primary-light dark:text-text-muted-dark dark:hover:text-text-primary-dark"
                  aria-label="Limpar busca"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar por status">
              {FILTER_OPTIONS.map((opt) => {
                const isActive = filter === opt.value;
                const count = opt.value === 'all' ? totalCount
                  : vaccines.filter((v) => v.calculated_status === opt.value).length;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    role="tab"
                    aria-selected={isActive}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                        : 'bg-primary-50 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-black/5 dark:bg-white/10 text-text-muted-light dark:text-text-muted-dark'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendario por mes */}
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
                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark bg-primary-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      {monthVaccines.length} vacina{monthVaccines.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {monthVaccines.map((vaccine) => (
                      <VaccineCard
                        key={vaccine.id}
                        vaccine={vaccine}
                        onMarkTaken={async (vid, date, n) => {
                          const { error: markError } = await markAsTaken(vid, date, n || undefined);
                          if (markError) showToast(markError.message);
                        }}
                        onUnmark={async (recordId) => {
                          const { error: unmarkError } = await unmarkVaccine(recordId);
                          if (unmarkError) showToast(unmarkError.message);
                        }}
                        onDeleteCustom={vaccine.is_custom ? async (vid) => {
                          const { error: delError } = await deleteCustomVaccine(vid);
                          if (delError) showToast(delError.message);
                        } : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(groupedVaccines).length === 0 && (
                <div className="text-center py-16">
                  <span className="text-5xl block mb-4">
                    {filter !== 'all' || search ? '🔍' : '📋'}
                  </span>
                  <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {filter !== 'all' || search
                      ? 'Nenhuma vacina encontrada com esses filtros'
                      : 'Nenhuma vacina encontrada'
                    }
                  </p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                    {filter !== 'all' || search
                      ? 'Tente outro filtro ou limpe a busca'
                      : 'Adicione uma vacina extra ou verifique os dados da crianca.'
                    }
                  </p>
                  {(filter !== 'all' || search) && (
                    <button
                      onClick={() => { setFilter('all'); setSearch(''); }}
                      className="btn-ghost text-primary-600 dark:text-primary-400 text-xs font-semibold mt-3"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Botao adicionar vacina extra */}
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
                          Doenca prevenida
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
