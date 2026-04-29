import { useState } from 'react';
import { useWorkouts } from '../hooks/useWorkouts';
import WorkoutSummaryCard from '../components/workout/WorkoutSummaryCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';

const PAGE_SIZE = 10;

export default function WorkoutHistoryPage() {
  const [page, setPage] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, error } = useWorkouts({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    from: from || undefined,
    to: to || undefined,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Workout History</h1>
        <p className="text-sm text-gray-500">
          {data?.total ?? 0} total workouts logged.
        </p>
      </div>

      {/* Date filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(0); }}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(0); }}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        {(from || to) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFrom(''); setTo(''); setPage(0); }}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 hover:text-gray-200"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {error && <ErrorBanner message="Failed to load workouts." />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : data?.workouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 py-12 text-center">
          <p className="text-gray-500">No workouts found.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data?.workouts.map((w) => (
              <WorkoutSummaryCard key={w.id} workout={w} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-400 disabled:opacity-40 hover:text-gray-200"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-400 disabled:opacity-40 hover:text-gray-200"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
