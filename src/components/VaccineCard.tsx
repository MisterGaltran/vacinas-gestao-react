import { memo, useState, useCallback } from 'react';
import type { VaccineWithRecord } from '../types';
import { StatusBadge } from './StatusBadge';
import { ConfirmModal } from './ConfirmModal';
import { CelebrationOverlay } from './CelebrationOverlay';

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

function VaccineCardImpl({ vaccine, onMarkTaken, onUnmark, onDeleteCustom }: VaccineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerDate, setRegisterDate] = useState(new Date().toISOString().split('T')[0]);
  const [registerPlace, setRegisterPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmUnmark, setConfirmUnmark] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const isLate = vaccine.calculated_status === 'late';
  const isTaken = vaccine.calculated_status === 'taken';

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerDate) return;
    const fullNotes = [registerPlace, notes].filter(Boolean).join(' | ');
    await onMarkTaken(vaccine.id, registerDate, fullNotes || undefined);
    setShowRegister(false);
    setShowCelebration(true);
    setNotes('');
    setRegisterPlace('');
    setRegisterDate(new Date().toISOString().split('T')[0]);
  }, [registerDate, registerPlace, notes, onMarkTaken, vaccine.id]);

  const handleUnmark = useCallback(async () => {
    if (!vaccine.record?.id) return;
    await onUnmark(vaccine.record.id);
    setConfirmUnmark(false);
  }, [vaccine.record?.id, onUnmark]);

  const handleDelete = useCallback(async () => {
    if (onDeleteCustom) {
      await onDeleteCustom(vaccine.id);
    }
    setConfirmDelete(false);
  }, [onDeleteCustom, vaccine.id]);

  // Border color sutil (sem animate-pulse no card inteiro)
  const borderClass = isTaken
    ? 'border-l-success-500'
    : isLate
      ? 'border-l-danger-500'
      : 'border-l-primary-400';

  const bgClass = isTaken
    ? 'bg-success-50/50 dark:bg-success-500/5'
    : isLate
      ? 'bg-danger-50/20 dark:bg-danger-500/5'
      : '';

  return (
    <>
      <div
        className={`card-premium border-l-[3px] relative overflow-hidden transition-all duration-300 ${borderClass} ${bgClass} group`}
      >
        {/* Indicador pulsante sutil para atrasadas (apenas um dot, nao o card inteiro) */}
        {isLate && (
          <div className="absolute top-3 right-3">
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger-500" />
            </span>
          </div>
        )}

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
                <span className="flex items-center gap-1 text-success-600 dark:text-emerald-300 font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(vaccine.record.administered_date)}
                </span>
              )}
            </div>

            {/* Custom badge */}
            {vaccine.is_custom && (
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] bg-accent-400/15 dark:bg-accent-400/20 text-accent-600 dark:text-accent-400 px-2 py-0.5 rounded-full font-semibold border border-accent-400/30">
                ⭐ Vacina Extra
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-primary-50 dark:hover:bg-white/5 hover:text-text-primary-light dark:hover:text-text-primary-dark transition-all duration-200"
              title="Detalhes"
              aria-label={expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
              aria-expanded={expanded}
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
                aria-label={`Registrar vacina ${vaccine.name}`}
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
                  aria-label="Desmarcar vacina"
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
                    aria-label="Excluir vacina extra"
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
              <span className="w-28 text-text-muted-light dark:text-text-muted-dark">Idade rec.:</span>
              <span className="font-medium">
                {vaccine.recommended_age_months > 0 ? `${vaccine.recommended_age_months} meses` : 'Ao nascer'}
              </span>
            </div>
            {vaccine.min_interval_days && vaccine.min_interval_days > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-28 text-text-muted-light dark:text-text-muted-dark">Intervalo:</span>
                <span className="font-medium">{vaccine.min_interval_days} dias entre doses</span>
              </div>
            )}
            {vaccine.description && (
              <div className="flex items-start gap-2">
                <span className="w-28 text-text-muted-light dark:text-text-muted-dark shrink-0">Descricao:</span>
                <span>{vaccine.description}</span>
              </div>
            )}
            {vaccine.record?.notes && (
              <div className="flex items-start gap-2">
                <span className="w-28 text-text-muted-light dark:text-text-muted-dark shrink-0">Observacoes:</span>
                <span className="text-text-primary-light dark:text-text-primary-dark">{vaccine.record.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Register form */}
        {showRegister && (
          <form onSubmit={handleRegister} className="mt-3 pt-3 border-t border-border-light dark:border-border-dark space-y-3 animate-scale-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                  Data da aplicacao
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
                  Local (UBS / clinica)
                </label>
                <input
                  type="text"
                  value={registerPlace}
                  onChange={(e) => setRegisterPlace(e.target.value)}
                  className="input-premium text-xs"
                  placeholder="Ex: UBS Vila Mariana"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">
                Observacoes (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-premium text-xs"
                placeholder="Lote, reacoes, etc..."
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-xs !py-2 !px-4">
                Confirmar aplicacao
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
      </div>

      {/* Modals */}
      <ConfirmModal
        open={confirmUnmark}
        onConfirm={handleUnmark}
        onCancel={() => setConfirmUnmark(false)}
        title="Desmarcar vacina?"
        description={`Desmarcar "${vaccine.name}" como tomada? O registro de aplicacao sera removido.`}
        confirmLabel="Sim, desmarcar"
        cancelLabel="Manter"
        icon="↩️"
        variant="warning"
      />

      <ConfirmModal
        open={confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        title="Excluir vacina extra?"
        description={`Excluir permanentemente "${vaccine.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        icon="🗑️"
        variant="danger"
      />

      {/* Celebration */}
      <CelebrationOverlay
        show={showCelebration}
        message={`${vaccine.name} registrada!`}
        onDone={() => setShowCelebration(false)}
      />
    </>
  );
}

export const VaccineCard = memo(VaccineCardImpl, (prev, next) => {
  if (prev.vaccine === next.vaccine) return true;
  return (
    prev.vaccine.id === next.vaccine.id &&
    prev.vaccine.calculated_status === next.vaccine.calculated_status &&
    prev.vaccine.calculated_date === next.vaccine.calculated_date &&
    prev.vaccine.record?.id === next.vaccine.record?.id &&
    prev.vaccine.record?.administered_date === next.vaccine.record?.administered_date &&
    prev.vaccine.record?.notes === next.vaccine.record?.notes
  );
});
