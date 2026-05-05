import type { Child } from '../types';

interface ChildSelectorProps {
  children: Child[];
  selectedChild: Child | null;
  onSelect: (child: Child) => void;
  onAddNew: () => void;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getChildColor(name: string): string {
  const colors = [
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
    'from-fuchsia-500 to-pink-600',
    'from-indigo-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function ChildSelector({ children: childList, selectedChild, onSelect, onAddNew }: ChildSelectorProps) {
  if (childList.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {childList.map((child) => {
        const isSelected = selectedChild?.id === child.id;
        const gradient = getChildColor(child.name);

        return (
          <button
            key={child.id}
            onClick={() => onSelect(child)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200 ${
              isSelected
                ? 'bg-gradient-to-r text-white shadow-md scale-105 ' + gradient
                : 'bg-primary-50 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-100 dark:hover:bg-white/10 hover:scale-105'
            }`}
            aria-label={`Selecionar ${child.name}`}
            aria-pressed={isSelected}
          >
            {/* Foto ou inicial */}
            {child.photo_url ? (
              <img
                src={child.photo_url}
                alt=""
                width={20}
                height={20}
                className={`w-5 h-5 rounded-full object-cover ${
                  isSelected ? 'border border-white/40' : 'border border-primary-200 dark:border-gray-600'
                }`}
              />
            ) : (
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-primary-200 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400'
                }`}
              >
                {getInitial(child.name)}
              </span>
            )}
            <span className="max-w-[80px] truncate">{child.name}</span>
          </button>
        );
      })}

      <button
        onClick={onAddNew}
        className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-xl border-2 border-dashed border-primary-200 dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-105"
        title="Adicionar crianca"
        aria-label="Cadastrar nova crianca"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Novo
      </button>
    </div>
  );
}
