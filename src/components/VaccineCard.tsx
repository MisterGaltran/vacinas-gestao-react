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

  // Border and accent color
  const accentClass = isTaken
    ? 'border-l-success-500 before:from-success-400 before:to-success-500'
    : isLate
      ? 'border-l-danger-500 before:from-danger-400 before:to-danger-500 animate-pulse'
      : 'border-l-primary-400 before:from-primary-400 before:to-primary-500';

  const bgClass = isTaken
    ? 'bg-success-50/50 dark:bg-success-500/5'
    : isLate
      ? 'bg-danger-50/30 dark:bg-danger-500/5'
      : '';

  return (
    <div
      className={`card-premium border-l-[3px] relative overflow-hidden transition-all duration-300 ${accentClass} ${bgClass} group`}
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${isLate ? 'animate-pulse' : ''}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              {vaccine.name}
              {vaccine.total_doses > 1 && (
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark font-normal ml-1">
                  Dose {vaccine.dose_number}/{vaccine.total_doses}
                </span>
              )}
            </h4>
            <StatusBadge status={vaccine.calculated_status} />
          </div>

          {/* Info row */}
          <div className="flex items-center gap-3 text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {vaccine.disease}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(vaccine.calculated_date)}
            </span>
            {isTaken && vaccine.record?.administered_date && (
              <span className="flex items-center gap-1 text-success-600 dark:text-green-400 font-medium">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(vaccine.record.administered_date)}
              </span>
            )}
          </div>

          {/* Custom badge */}
          {vaccine.is_custom && (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-accent-400/15 dark:bg-accent-400/20 text-accent-600 dark:text-accent-400 px-2 py-0.5 rounded-full font-semibold border border-accent-400/30">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Vacina Extra
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary-light dark:hover:text-text-primary-dark transition-all duration-200"
            title="Detalhes"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {!isTaken && (
            <button
              onClick={() => setShowRegister(!showRegister)}
              className="btn-primary text-xs !py-1.5 !px-3 !rounded-lg"
            >
              ✓ Registrar
            </button>
          )}

          {isTaken && (
            <>
              <button
                onClick={() => setConfirmUnmark(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 transition-all duration-200 text-sm"
                title="Desmarcar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              {onDeleteCustom && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 hover:text-danger-600 transition-all duration-200"
                  title="Excluir"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark text-xs text-text-secondary-light dark:text-text-secondary-dark space-y-2 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <span className="w-24 text-text-muted-light dark:text-text-muted-dark">Idade rec.:</span>
            <span className="font-medium">
              {vaccine.recommended_age_months > 0 ? `${vaccine.recommended_age_months} meses` : 'Ao nascer'}
            </span>
          </div>
          {vaccine.min_interval_days && vaccine.min_interval_days > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-24 text-text-muted-light dark:text-text-muted-dark">Intervalo:</span>
              <span className="font-medium">{vaccine.min_interval_days} dias entre doses</span>
            </div>
          )}
          {vaccine.description && (
            <div className="flex items-start gap-2">
              <span className="w-24 text-text-muted-light dark:text-text-muted-dark shrink-0">Notas:</span>
              <span>{vaccine.description}</span>
            </div>
          )}
        </div>
      )}

      {/* Register form */}
      {showRegister && (
        <form onSubmit={handleRegister} className="mt-3 pt-3 border-t border-border-light dark:border-border-dark space-y-3 animate-scale-in">
          <div>
            <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
              Data da aplicação
            </label>
            <input
              type="date"
              value={registerDate}
              onChange={(e) => setRegisterDate(e.target.value)}
              required
              className="input-premium text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-premium text-xs"
              placeholder="Lote, local de aplicação..."
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs !py-2 !px-4">
              Confirmar aplicação
            </button>
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="btn-secondary text-xs !py-2 !px-4"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Unmark confirmation */}
      {confirmUnmark && (
        <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark animate-scale-in">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 font-medium">
            Desmarcar esta vacina como tomada?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUnmark}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Sim, desmarcar
            </button>
            <button
              onClick={() => setConfirmUnmark(false)}
              className="btn-secondary text-xs !py-1.5 !px-3"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark animate-scale-in">
          <p className="text-xs text-danger-600 dark:text-danger-400 mb-3 font-medium">
            Excluir permanentemente esta vacina extra?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-danger-500 text-white hover:bg-danger-600 transition-colors"
            >
              Sim, excluir
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn-secondary text-xs !py-1.5 !px-3"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}