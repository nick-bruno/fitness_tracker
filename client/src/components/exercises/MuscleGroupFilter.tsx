import { useState } from 'react';
import type { MuscleGroup } from '../../types';

interface Props {
  groups: MuscleGroup[];
  selectedId: number | undefined;
  onSelect: (id: number | undefined) => void;
}

export default function MuscleGroupFilter({ groups, selectedId, onSelect }: Props) {
  const [openParents, setOpenParents] = useState<Set<number>>(new Set());

  const toggleParent = (id: number) => {
    setOpenParents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activeBtn = 'bg-[var(--accent-light)] text-indigo-700 dark:text-indigo-300';
  const inactiveBtn = 'text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]';

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-card">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-3)]">
        Muscle Group
      </p>
      <button
        onClick={() => onSelect(undefined)}
        className={`mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-all duration-150 ${
          selectedId == null ? activeBtn : inactiveBtn
        }`}
      >
        All
      </button>
      {groups.map((parent) => (
        <div key={parent.id}>
          <button
            onClick={() => toggleParent(parent.id)}
            className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors`}
          >
            {parent.name}
            <span className={`text-[10px] text-[var(--text-3)] transition-transform duration-150 ${openParents.has(parent.id) ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {openParents.has(parent.id) && (
            <div className="ml-3 mt-0.5 flex flex-col gap-0.5 animate-fade-in">
              {parent.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onSelect(child.id === selectedId ? undefined : child.id)}
                  className={`rounded-lg px-2 py-1 text-left text-xs font-medium transition-all duration-150 ${
                    selectedId === child.id ? activeBtn : inactiveBtn
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
