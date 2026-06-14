import { useState } from 'react';
import { fetchWorkout } from '../../api/client';
import { useWorkouts } from '../../hooks/useWorkouts';
import type { WorkoutDetail } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
  onSelect: (workout: WorkoutDetail) => void;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CopyWorkoutModal({ onSelect, onClose }: Props) {
  const [loadingId, setLoadingId] = useState<number | undefined>();
  const { data, isLoading } = useWorkouts({ limit: 30 });

  const handlePick = async (id: number) => {
    setLoadingId(id);
    try {
      const workout = await fetchWorkout(id);
      onSelect(workout);
      onClose();
    } finally {
      setLoadingId(undefined);
    }
  };

  const workouts = data?.workouts ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[75vh] w-full max-w-lg flex-col rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="font-semibold text-gray-100">Copy from Previous Workout</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading ? (
            <div className="flex justify-center pt-8">
              <LoadingSpinner />
            </div>
          ) : workouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No previous workouts found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {workouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handlePick(w.id)}
                  disabled={loadingId != null}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-800/50 px-4 py-3 text-left transition-colors hover:border-indigo-700 hover:bg-gray-800 disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-100">
                      {w.title || 'Untitled workout'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{formatDate(w.logged_at)}</p>
                    {w.exercise_names.length > 0 && (
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {w.exercise_names.join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex-shrink-0 text-xs text-gray-500">
                    {loadingId === w.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <span>{w.total_sets} sets</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
