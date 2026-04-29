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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this workout?')) {
      deleteMutation.mutate(workout.id);
    }
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          {workout.title && (
            <p className="font-semibold text-gray-100">{workout.title}</p>
          )}
          <p className={workout.title ? 'text-xs text-gray-400' : 'text-sm font-semibold text-gray-100'}>
            {date}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''} ·{' '}
            {workout.total_sets} sets
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/log/${workout.id}`)}
            className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-900/40"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30"
          >
            Delete
          </button>
        </div>
      </div>

      {workout.exercise_names.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {workout.exercise_names.slice(0, 5).map((name) => (
            <span key={name} className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
              {name}
            </span>
          ))}
          {workout.exercise_names.length > 5 && (
            <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
              +{workout.exercise_names.length - 5} more
            </span>
          )}
        </div>
      )}

      {workout.notes && (
        <p className="mt-2 text-xs italic text-gray-500">{workout.notes}</p>
      )}
    </div>
  );
}
