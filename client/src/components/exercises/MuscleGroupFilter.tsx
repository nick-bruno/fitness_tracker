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

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Muscle Group
      </p>
      <button
        onClick={() => onSelect(undefined)}
        className={`mb-1 w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
          selectedId == null ? 'bg-indigo-900/60 text-indigo-300' : 'text-gray-400 hover:bg-gray-800'
        }`}
      >
        All
      </button>
      {groups.map((parent) => (
        <div key={parent.id}>
          <button
            onClick={() => toggleParent(parent.id)}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            {parent.name}
            <span className="text-xs">{openParents.has(parent.id) ? '▲' : '▼'}</span>
          </button>
          {openParents.has(parent.id) && (
            <div className="ml-3 flex flex-col gap-0.5">
              {parent.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onSelect(child.id === selectedId ? undefined : child.id)}
                  className={`rounded px-2 py-1 text-left text-xs transition-colors ${
                    selectedId === child.id
                      ? 'bg-indigo-900/60 text-indigo-300'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
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
