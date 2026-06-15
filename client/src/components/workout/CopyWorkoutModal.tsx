import { useState } from 'react';
import { fetchWorkout } from '../../api/client';
import { useWorkouts } from '../../hooks/useWorkouts';
import type { WorkoutDetail } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { WorkoutCardSkeleton } from '../shared/Skeleton';

interface Props {
  onSelect: (workout: WorkoutDetail) => void;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex h-[75vh] w-full max-w-lg flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--text-1)]">Copy from Previous Workout</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--text-3)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading ? (
            <div className="flex flex-col gap-2 stagger">
              {Array.from({ length: 5 }).map((_, i) => <WorkoutCardSkeleton key={i} />)}
            </div>
          ) : workouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-3)]">No previous workouts found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {workouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handlePick(w.id)}
                  disabled={loadingId != null}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-left shadow-card transition-all hover:border-indigo-300 hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--text-1)]">{w.title || 'Untitled workout'}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-3)]">{formatDate(w.logged_at)}</p>
                    {w.exercise_names.length > 0 && (
                      <p className="mt-1 truncate text-xs text-[var(--text-2)]">
                        {w.exercise_names.join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {loadingId === w.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--text-2)]">
                        {w.total_sets} sets
                      </span>
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
