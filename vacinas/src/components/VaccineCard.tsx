import { useState } from 'react';
import type { VaccineWithRecord } from '../types';
import { StatusBadge } from './StatusBadge';

interface VaccineCardProps {
  vaccine: VaccineWithRecord;
  onMarkTaken: (vaccineTypeId: string, date: string, notes?: string) => void;
  onUnmark: (recordId: string) => void;
  onDeleteCustom?: (vaccineTypeId: string) => void;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function VaccineCard({ vaccine, onMarkTaken, onUnmark, onDeleteCustom }: VaccineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerDate, setRegisterDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [confirmUnmark, setConfirmUnmark] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isLate = vaccine.calculated_status === 'late';
  const isTaken = vaccine.calculated_status === 'taken';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerDate) return;
    await onMarkTaken(vaccine.id, registerDate, notes || undefined);
    setShowRegister(false);
    setNotes('');
    setRegisterDate(new Date().toISOString().split('T')[0]);
  };

  const handleUnmark = async () => {
    if (!vaccine.record?.id) return;
    await onUnmark(vaccine.record.id);
    setConfirmUnmark(false);
  };

  const handleDelete = async () => {
    if (onDeleteCustom) {
      await onDeleteCustom(vaccine.id);
    }
    setConfirmDelete(false);
  };

  const borderColor = isTaken
    ? 'border-green-200 bg-green-50/50'
    : isLate
      ? 'border-red-200 bg-red-50/50'
      : 'border-gray-200';

  return (
    <div className={`bg-white rounded-xl border ${borderColor} p-4 transition-colors`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">
              {vaccine.name}
              {vaccine.total_doses > 1 ? ` - Dose ${vaccine.dose_number} de ${vaccine.total_doses}` : ''}
            </h4>
            <StatusBadge status={vaccine.calculated_status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Previne: {vaccine.disease}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Data prevista: {formatDate(vaccine.calculated_date)}
            {isTaken && vaccine.record?.administered_date && ` • Tomada em: ${formatDate(vaccine.record.administered_date)}`}
          </p>
          {vaccine.is_custom && (
            <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
              Extra
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
            title="Detalhes"
          >
            {expanded ? '▲' : '▼'}
          </button>

          {!isTaken && (
            <button
              onClick={() => setShowRegister(!showRegister)}
              className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              ✓ Registrar
            </button>
          )}

          {isTaken && (
            <>
              <button
                onClick={() => setConfirmUnmark(true)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                title="Desmarcar"
              >
                ↩
              </button>
              {onDeleteCustom && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                  title="Excluir"
                >
                  🗑
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
          <p>Idade recomendada: {vaccine.recommended_age_months > 0 ? `${vaccine.recommended_age_months} meses` : 'Ao nascer'}</p>
          {vaccine.min_interval_days && vaccine.min_interval_days > 0 && <p>Intervalo entre doses: {vaccine.min_interval_days} dias</p>}
          {vaccine.description && <p>Notas: {vaccine.description}</p>}
        </div>
      )}

      {/* Formulário de registro */}
      {showRegister && (
        <form onSubmit={handleRegister} className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data da aplicação</label>
            <input
              type="date"
              value={registerDate}
              onChange={(e) => setRegisterDate(e.target.value)}
              required
              className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Lote, local..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Confirmação de desmarcar */}
      {confirmUnmark && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-amber-700 mb-2">Tem certeza que deseja desmarcar esta vacina?</p>
          <div className="flex gap-2">
            <button
              onClick={handleUnmark}
              className="bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Sim, desmarcar
            </button>
            <button
              onClick={() => setConfirmUnmark(false)}
              className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Confirmação de deletar */}
      {confirmDelete && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-red-700 mb-2">Tem certeza que deseja excluir esta vacina extra?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Sim, excluir
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}