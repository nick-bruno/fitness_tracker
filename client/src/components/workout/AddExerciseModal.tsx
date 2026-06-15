import { useState, useMemo } from 'react';
import type { Exercise, MuscleGroup } from '../../types';
import { useExercises, useMuscleGroups } from '../../hooks/useExercises';
import ExerciseSearchBar from '../exercises/ExerciseSearchBar';
import ExerciseCard from '../exercises/ExerciseCard';
import { CardSkeleton } from '../shared/Skeleton';

interface Props {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

type ChipDef =
  | { label: string; kind: 'parent'; id: number }
  | { label: string; kind: 'subset'; parentId: number; match: RegExp };

function buildChips(groups: MuscleGroup[]): ChipDef[] {
  return groups.flatMap((g): ChipDef[] => {
    if (g.name === 'Arms') {
      return [
        { label: 'Biceps', kind: 'subset', parentId: g.id, match: /bicep|brachialis/i },
        { label: 'Triceps', kind: 'subset', parentId: g.id, match: /tricep/i },
      ];
    }
    return [{ label: g.name, kind: 'parent', id: g.id }];
  });
}

export default function AddExerciseModal({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState<ChipDef | undefined>();

  const { data: muscleGroups } = useMuscleGroups();
  const chips = useMemo(() => buildChips(muscleGroups ?? []), [muscleGroups]);

  const fetchMuscleGroupId =
    activeChip?.kind === 'parent' ? activeChip.id :
    activeChip?.kind === 'subset' ? activeChip.parentId :
    undefined;

  const { data: rawExercises, isLoading } = useExercises({ search, muscleGroupId: fetchMuscleGroupId });

  const exercises = useMemo(() => {
    if (!rawExercises || activeChip?.kind !== 'subset') return rawExercises;
    return rawExercises.filter((ex) =>
      ex.muscles.some((m) => activeChip.match.test(m.muscle_group_name)),
    );
  }, [rawExercises, activeChip]);

  const handleChipClick = (chip: ChipDef) => {
    setActiveChip((prev) => (prev?.label === chip.label ? undefined : chip));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--text-1)]">Add Exercise</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--text-3)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] transition-colors">✕</button>
        </div>

        <div className="space-y-2.5 px-5 pt-3 pb-2">
          <ExerciseSearchBar value={search} onChange={setSearch} />

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                    activeChip?.label === chip.label
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {isLoading ? (
            <div className="flex flex-col gap-2 pt-2 stagger">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {exercises?.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} selectable onSelect={(e) => { onSelect(e); onClose(); }} />
              ))}
              {exercises?.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--text-2)]">No exercises found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
