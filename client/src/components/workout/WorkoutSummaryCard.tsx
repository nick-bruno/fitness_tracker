import { useNavigate } from 'react-router-dom';
import type { WorkoutSummary } from '../../types';
import { useDeleteWorkout } from '../../hooks/useWorkouts';

interface Props {
  workout: WorkoutSummary;
}

export default function WorkoutSummaryCard({ workout }: Props) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteWorkout();

  const date = new Date(workout.logged_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this workout?')) deleteMutation.mutate(workout.id);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-card card-hover animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {workout.title && (
            <p className="font-semibold text-[var(--text-1)] truncate">{workout.title}</p>
          )}
          <p className={`${workout.title ? 'text-xs text-[var(--text-2)]' : 'text-sm font-semibold text-[var(--text-1)]'}`}>
            {date}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-3)]">
            {workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''} · {workout.total_sets} sets
            {workout.location && (
              <span className="ml-1.5">· <span className="text-[var(--text-2)]">{workout.location}</span></span>
            )}
          </p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => navigate(`/log/${workout.id}`)}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-[var(--accent-light)] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--text-3)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {workout.exercise_names.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {workout.exercise_names.slice(0, 5).map((name) => (
            <span key={name} className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-2)]">
              {name}
            </span>
          ))}
          {workout.exercise_names.length > 5 && (
            <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-3)]">
              +{workout.exercise_names.length - 5} more
            </span>
          )}
        </div>
      )}

      {workout.notes && (
        <p className="mt-2 text-xs italic text-[var(--text-3)]">{workout.notes}</p>
      )}
    </div>
  );
}
