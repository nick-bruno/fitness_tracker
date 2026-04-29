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
      className={`rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors ${
        selectable ? 'cursor-pointer hover:border-indigo-700' : ''
      }`}
      onClick={selectable && onSelect ? () => onSelect(exercise) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-100">{exercise.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
              {exercise.equipment}
            </span>
            <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
              {exercise.movement_pattern}
            </span>
          </div>
        </div>
        {!selectable && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {primaries.map((m) => (
          <MuscleTagBadge key={m.muscle_group_id} name={m.muscle_group_name} role="primary" />
        ))}
        {secondaries.map((m) => (
          <MuscleTagBadge key={m.muscle_group_id} name={m.muscle_group_name} role="secondary" />
        ))}
      </div>

      {expanded && exercise.description && (
        <p className="mt-3 text-sm text-gray-400">{exercise.description}</p>
      )}
    </div>
  );
}
