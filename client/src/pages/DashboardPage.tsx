import { useNavigate } from 'react-router-dom';
import { useWorkouts, useMuscleSummary } from '../hooks/useWorkouts';
import { useRunsSummary } from '../hooks/useRuns';
import WorkoutSummaryCard from '../components/workout/WorkoutSummaryCard';
import MuscleHeatmap from '../components/recommendations/MuscleHeatmap';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function formatPace(durationSeconds: number, distanceMiles: number): string {
  if (distanceMiles === 0) return '--';
  const paceSeconds = durationSeconds / distanceMiles;
  const m = Math.floor(paceSeconds / 60);
  const s = Math.round(paceSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}/mi`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: workoutsData, isLoading: loadingWorkouts } = useWorkouts({ limit: 3, offset: 0 });
  const { data: muscleSummary, isLoading: loadingMuscles } = useMuscleSummary(7);
  const { data: runSummary } = useRunsSummary(7, 'run');
  const { data: rowSummary } = useRunsSummary(7, 'row');

  const workouts = workoutsData?.workouts ?? [];
  const thisWeekWorkouts = workouts.filter((w) => {
    const diff = (Date.now() - new Date(w.logged_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500">Track your progress and plan your next session.</p>
        </div>
        <button
          onClick={() => navigate('/log')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 active:bg-indigo-700"
        >
          + Log Workout
        </button>
      </div>

      {/* Strength stats */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">This Week — Strength</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-indigo-400">{thisWeekWorkouts.length}</p>
            <p className="mt-1 text-xs text-gray-500">Workouts</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-indigo-400">
              {thisWeekWorkouts.reduce((sum, w) => sum + w.total_sets, 0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Total sets</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-indigo-400">{workoutsData?.total ?? 0}</p>
            <p className="mt-1 text-xs text-gray-500">Total workouts logged</p>
          </div>
        </div>
      </div>

      {/* Running stats */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">This Week — Running</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{runSummary?.total_runs ?? 0}</p>
            <p className="mt-1 text-xs text-gray-500">Runs</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">
              {(runSummary?.total_miles ?? 0).toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Miles</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">
              {runSummary && runSummary.total_runs > 0
                ? formatPace(runSummary.total_seconds, runSummary.total_miles)
                : '--'}
            </p>
            <p className="mt-1 text-xs text-gray-500">Avg pace</p>
          </div>
        </div>
      </div>

      {/* Rowing stats */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">This Week — Rowing</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-sky-400">{rowSummary?.total_runs ?? 0}</p>
            <p className="mt-1 text-xs text-gray-500">Rows</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-sky-400">
              {(rowSummary?.total_miles ?? 0).toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Miles</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-3xl font-bold text-sky-400">
              {rowSummary && rowSummary.total_runs > 0
                ? formatPace(rowSummary.total_seconds, rowSummary.total_miles)
                : '--'}
            </p>
            <p className="mt-1 text-xs text-gray-500">Avg pace</p>
          </div>
        </div>
      </div>

      {/* Muscle heatmap */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-4 font-semibold text-gray-200">7-Day Muscle Coverage</h2>
        {loadingMuscles ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : (
          <MuscleHeatmap summary={muscleSummary ?? []} />
        )}
      </div>

      {/* Recent workouts */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-200">Recent Workouts</h2>
          <button
            onClick={() => navigate('/history')}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            View all →
          </button>
        </div>
        {loadingWorkouts ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : workouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 py-12 text-center">
            <p className="text-gray-500">No workouts yet.</p>
            <button
              onClick={() => navigate('/log')}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Log your first workout →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {workouts.map((w) => (
              <WorkoutSummaryCard key={w.id} workout={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
