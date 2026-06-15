import { useState } from 'react';
import { useWorkouts } from '../hooks/useWorkouts';
import WorkoutSummaryCard from '../components/workout/WorkoutSummaryCard';
import { WorkoutCardSkeleton } from '../components/shared/Skeleton';
import ErrorBanner from '../components/shared/ErrorBanner';

const PAGE_SIZE = 10;

const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-indigo-400 focus:outline-none transition-colors';

export default function WorkoutHistoryPage() {
  const [page, setPage] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, error } = useWorkouts({
    limit: PAGE_SIZE, offset: page * PAGE_SIZE,
    from: from || undefined, to: to || undefined,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-1)]">Workout History</h1>
        <p className="mt-0.5 text-sm text-[var(--text-3)]">{data?.total ?? 0} total workouts logged.</p>
      </div>

      {/* Date filters */}
      <div className="flex gap-3 animate-fade-up">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--text-2)]">From</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className={inputCls} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--text-2)]">To</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} className={inputCls} />
        </div>
        {(from || to) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFrom(''); setTo(''); setPage(0); }}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {error && <ErrorBanner message="Failed to load workouts." />}

      {isLoading ? (
        <div className="flex flex-col gap-3 stagger">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <WorkoutCardSkeleton key={i} />)}
        </div>
      ) : data?.workouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-12 text-center">
          <p className="text-[var(--text-3)]">No workouts found.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 stagger">
            {data?.workouts.map((w) => <WorkoutSummaryCard key={w.id} workout={w} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm font-medium text-[var(--text-2)] disabled:opacity-40 hover:text-[var(--text-1)] transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm font-medium text-[var(--text-2)]">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm font-medium text-[var(--text-2)] disabled:opacity-40 hover:text-[var(--text-1)] transition-colors"
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
