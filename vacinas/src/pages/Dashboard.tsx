import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChildren } from '../hooks/useChildren';
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

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { children, loading: childrenLoading, addChild } = useChildren(user);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const { vaccines, loading: vaccinesLoading, markAsTaken, unmarkVaccine, addCustomVaccine, deleteCustomVaccine } = useVaccines(selectedChild);

  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');

  // Form custom vaccine
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

  // Count status
  const takenCount = vaccines.filter((v) => v.calculated_status === 'taken').length;
  const lateCount = vaccines.filter((v) => v.calculated_status === 'late').length;
  const upcomingCount = vaccines.filter((v) => v.calculated_status === 'upcoming').length;
  const totalCount = vaccines.length;

  const groupedVaccines = groupByMonth(vaccines);

  return (
    <Layout
      title="Gestão de Vacinas"
      onLogout={signOut}
      rightContent={
        children.length > 0 ? (
          <ChildSelector
            children={children}
            selectedChild={selectedChild}
            onSelect={setSelectedChild}
            onAddNew={() => setShowAddChild(true)}
          />
        ) : null
      }
    >
      {/* Sem crianças cadastradas */}
      {!childrenLoading && children.length === 0 && !showAddChild && (
        <div className="text-center py-16">
          <span className="text-6xl">👶</span>
          <h2 className="text-lg font-bold text-gray-900 mt-6">Nenhuma criança cadastrada</h2>
          <p className="text-sm text-gray-500 mt-2">
            Cadastre uma criança para começar a acompanhar as vacinas.
          </p>
          <button
            onClick={() => setShowAddChild(true)}
            className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Cadastrar Criança
          </button>
        </div>
      )}

      {/* Formulário de adicionar criança */}
      {showAddChild && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Cadastrar Criança</h3>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
          )}
          <form onSubmit={handleAddChild} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome da criança"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={childBirthDate}
                onChange={(e) => setChildBirthDate(e.target.value)}
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowAddChild(false)}
                className="bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard com dados */}
      {selectedChild && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">{selectedChild.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
              <p className="text-[10px] text-gray-400">Total de vacinas</p>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
              <p className="text-xs text-green-700 font-medium">✅</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{takenCount}</p>
              <p className="text-[10px] text-green-600">Tomadas</p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-4 text-center">
              <p className="text-xs text-red-700 font-medium">🔴</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{lateCount}</p>
              <p className="text-[10px] text-red-600">Atrasadas</p>
            </div>
            <div className="bg-white rounded-xl border border-blue-200 p-4 text-center">
              <p className="text-xs text-blue-700 font-medium">🔜</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{upcomingCount}</p>
              <p className="text-[10px] text-blue-600">Próximas (30d)</p>
            </div>
          </div>

          {/* Calendário por mês */}
          {vaccinesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-500 mt-3">Carregando vacinas...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedVaccines).map(([monthKey, monthVaccines]) => (
                <div key={monthKey}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {formatMonthLabel(monthKey)}
                  </h3>
                  <div className="space-y-2">
                    {monthVaccines.map((vaccine) => (
                      <VaccineCard
                        key={vaccine.id}
                        vaccine={vaccine}
                        onMarkTaken={markAsTaken}
                        onUnmark={unmarkVaccine}
                        onDeleteCustom={vaccine.is_custom ? deleteCustomVaccine : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(groupedVaccines).length === 0 && (
                <p className="text-center text-sm text-gray-500 py-8">
                  Nenhuma vacina encontrada para esta criança.
                </p>
              )}

              {/* Botão adicionar vacina extra */}
              <div className="text-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAddCustom ? 'Cancelar' : '+ Adicionar vacina extra'}
                </button>

                {showAddCustom && (
                  <form
                    onSubmit={handleAddCustom}
                    className="mt-4 bg-white border border-gray-200 rounded-xl p-6 text-left space-y-4"
                  >
                    <h4 className="text-sm font-semibold text-gray-900">Nova Vacina Extra</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nome da vacina</label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          required
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Dengue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Doença prevenida</label>
                        <input
                          type="text"
                          value={customDisease}
                          onChange={(e) => setCustomDisease(e.target.value)}
                          required
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Dengue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Idade recomendada (meses)</label>
                        <input
                          type="number"
                          value={customAge}
                          onChange={(e) => setCustomAge(parseInt(e.target.value) || 0)}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Data prevista</label>
                        <input
                          type="date"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          required
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Adicionar
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}