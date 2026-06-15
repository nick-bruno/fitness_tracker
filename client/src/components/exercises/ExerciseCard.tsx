import { useState } from 'react';
import type { Exercise } from '../../types';
import MuscleTagBadge from './MuscleTagBadge';

interface Props {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  selectable?: boolean;
}

export default function ExerciseCard({ exercise, onSelect, selectable }: Props) {
  const [expanded, setExpanded] = useState(false);

  const primaries = exercise.muscles.filter((m) => m.role === 'primary');
  const secondaries = exercise.muscles.filter((m) => m.role === 'secondary');

  return (
    <div
      className={`rounded-xl border bg-[var(--bg-card)] p-4 shadow-card transition-all duration-200 ${
        selectable
          ? 'cursor-pointer border-[var(--border)] hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-card-hover hover:-translate-y-0.5'
          : 'border-[var(--border)] card-hover'
      }`}
      onClick={selectable && onSelect ? () => onSelect(exercise) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-1)] truncate">{exercise.name}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--text-2)]">
              {exercise.equipment}
            </span>
            <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--text-2)]">
              {exercise.movement_pattern}
            </span>
          </div>
        </div>
        {!selectable && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors p-1"
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {(primaries.length > 0 || secondaries.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {primaries.map((m) => (
            <MuscleTagBadge key={m.muscle_group_id} name={m.muscle_group_name} role="primary" />
          ))}
          {secondaries.map((m) => (
            <MuscleTagBadge key={m.muscle_group_id} name={m.muscle_group_name} role="secondary" />
          ))}
        </div>
      )}

      {expanded && exercise.description && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)] animate-fade-in">
          {exercise.description}
        </p>
      )}
    </div>
  );
}
