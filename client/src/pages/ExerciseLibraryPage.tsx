import { useState } from 'react';
import { useExercises, useMuscleGroups } from '../hooks/useExercises';
import ExerciseCard from '../components/exercises/ExerciseCard';
import ExerciseSearchBar from '../components/exercises/ExerciseSearchBar';
import MuscleGroupFilter from '../components/exercises/MuscleGroupFilter';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';

const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<number | undefined>();
  const [selectedEquipment, setSelectedEquipment] = useState<string | undefined>();

  const { data: exercises, isLoading, error } = useExercises({
    search,
    muscleGroupId: selectedMuscleGroup,
    equipment: selectedEquipment,
  });

  const { data: muscleGroups } = useMuscleGroups();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Exercise Library</h1>
        <p className="text-sm text-gray-500">
          {exercises?.length ?? 0} exercises — search and filter by muscle group or equipment.
        </p>
      </div>

      <div className="flex gap-5">
        {/* Filters sidebar */}
        <div className="w-52 flex-shrink-0 space-y-4">
          {muscleGroups && (
            <MuscleGroupFilter
              groups={muscleGroups}
              selectedId={selectedMuscleGroup}
              onSelect={setSelectedMuscleGroup}
            />
          )}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Equipment
            </p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedEquipment(undefined)}
                className={`rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  !selectedEquipment
                    ? 'bg-indigo-900/60 text-indigo-300'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                All
              </button>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  onClick={() =>
                    setSelectedEquipment(eq === selectedEquipment ? undefined : eq)
                  }
                  className={`rounded px-2 py-1.5 text-left text-sm transition-colors ${
                    selectedEquipment === eq
                      ? 'bg-indigo-900/60 text-indigo-300'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise grid */}
        <div className="flex-1 space-y-3">
          <ExerciseSearchBar value={search} onChange={setSearch} />

          {error && <ErrorBanner message="Failed to load exercises." />}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : exercises?.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No exercises match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {exercises?.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
