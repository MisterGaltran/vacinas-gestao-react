import type { Child } from '../types';

interface ChildSelectorProps {
  children: Child[];
  selectedChild: Child | null;
  onSelect: (child: Child) => void;
  onAddNew: () => void;
}

export function ChildSelector({ children, selectedChild, onSelect, onAddNew }: ChildSelectorProps) {
  if (children.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {children.map((child) => (
        <button
          key={child.id}
          onClick={() => onSelect(child)}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium ${
            selectedChild?.id === child.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {child.name}
        </button>
      ))}
      <button
        onClick={onAddNew}
        className="text-xs px-2.5 py-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-dashed border-gray-300 transition-colors"
        title="Adicionar criança"
      >
        + Novo
      </button>
    </div>
  );
}