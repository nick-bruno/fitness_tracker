import { useState } from 'react';
import { useExercises, useMuscleGroups } from '../hooks/useExercises';
import ExerciseCard from '../components/exercises/ExerciseCard';
import ExerciseSearchBar from '../components/exercises/ExerciseSearchBar';
import MuscleGroupFilter from '../components/exercises/MuscleGroupFilter';
import { CardSkeleton } from '../components/shared/Skeleton';
import ErrorBanner from '../components/shared/ErrorBanner';

const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<number | undefined>();
  const [selectedEquipment, setSelectedEquipment] = useState<string | undefined>();

  const { data: exercises, isLoading, error } = useExercises({
    search, muscleGroupId: selectedMuscleGroup, equipment: selectedEquipment,
  });
  const { data: muscleGroups } = useMuscleGroups();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-1)]">Exercise Library</h1>
        <p className="mt-0.5 text-sm text-[var(--text-3)]">
          {exercises?.length ?? 0} exercises — search and filter by muscle group or equipment.
        </p>
      </div>

      <div className="flex gap-5">
        {/* Filters sidebar */}
        <div className="w-52 flex-shrink-0 space-y-3 animate-fade-up">
          {muscleGroups && (
            <MuscleGroupFilter groups={muscleGroups} selectedId={selectedMuscleGroup} onSelect={setSelectedMuscleGroup} />
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-card">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-3)]">
              Equipment
            </p>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => setSelectedEquipment(undefined)}
                className={`rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-all duration-150 ${
                  !selectedEquipment ? 'bg-[var(--accent-light)] text-indigo-700 dark:text-indigo-300' : 'text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]'
                }`}
              >
                All
              </button>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  onClick={() => setSelectedEquipment(eq === selectedEquipment ? undefined : eq)}
                  className={`rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-all duration-150 ${
                    selectedEquipment === eq ? 'bg-[var(--accent-light)] text-indigo-700 dark:text-indigo-300' : 'text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise grid */}
        <div className="flex-1 space-y-3 min-w-0">
          <ExerciseSearchBar value={search} onChange={setSearch} />
          {error && <ErrorBanner message="Failed to load exercises." />}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 stagger">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : exercises?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] py-12 text-center">
              <p className="text-[var(--text-3)]">No exercises match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {exercises?.map((ex) => <ExerciseCard key={ex.id} exercise={ex} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
