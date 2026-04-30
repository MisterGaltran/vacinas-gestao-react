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
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
    'from-fuchsia-500 to-pink-600',
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
                : 'bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/10 dark:hover:bg-white/10 hover:scale-105'
            }`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                isSelected
                  ? 'bg-white/25 text-white'
                  : 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
              }`}
            >
              {getInitial(child.name)}
            </span>
            {child.name}
          </button>
        );
      })}

      <button
        onClick={onAddNew}
        className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-xl border-2 border-dashed border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-105"
        title="Adicionar criança"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Novo
      </button>
    </div>
  );
}