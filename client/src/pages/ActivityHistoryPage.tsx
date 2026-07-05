import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRuns, useDeleteRun, useRunsSummary } from '../hooks/useRuns';
import type { Run } from '../types';

const ACTIVITY_META: Record<string, { label: string; emoji: string; colorCls: string }> = {
  tennis:     { label: 'Tennis',     emoji: '🎾', colorCls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  golf:       { label: 'Golf',       emoji: '⛳', colorCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  pickleball: { label: 'Pickleball', emoji: '🏓', colorCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

const PAGE_SIZE = 10;

function ActivityRow({ run, onEdit, onDelete }: { run: Run; onEdit: () => void; onDelete: () => void }) {
  const meta = ACTIVITY_META[run.type] ?? { label: run.type, emoji: '🏅', colorCls: 'bg-gray-100 text-gray-700' };
  return (
    <div className="card-hover flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-xl">
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.colorCls}`}>
            {meta.label}
          </span>
          {run.notes && (
            <span className="truncate text-xs text-[var(--text-3)]">{run.notes}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-[var(--text-3)]">{formatDate(run.logged_at)}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-[var(--text-1)]">{formatDuration(run.duration_seconds)}</p>
      </div>
      <div className="flex flex-shrink-0 gap-1">
        <button
          onClick={onEdit}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text-1)] transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-200 dark:border-red-800/40 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function ActivityHistoryPage() {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useRuns({
    limit: PAGE_SIZE,
    offset,
    type: 'activity',
    from: from || undefined,
    to: to || undefined,
  });
  const { data: summary } = useRunsSummary(7, 'activity');
  const deleteMutation = useDeleteRun();

  const runs = data?.runs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this activity?')) return;
    await deleteMutation.mutateAsync(id);
    if (runs.length === 1 && offset > 0) setOffset(o => o - PAGE_SIZE);
  };

  const inputCls = 'rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-1)] focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/30';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Activities</h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">Tennis, Golf & Pickleball sessions</p>
        </div>
        <button
          onClick={() => navigate('/log-activity')}
          className="rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 transition-all"
        >
          + Log Activity
        </button>
      </div>

      {/* Weekly summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessions this week', value: String(summary.total_runs) },
            { label: 'Total time', value: formatDuration(summary.total_seconds) },
            { label: 'Avg per session', value: summary.total_runs > 0 ? formatDuration(Math.round(summary.total_seconds / summary.total_runs)) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center">
              <p className="text-xl font-bold text-[var(--text-1)]">{value}</p>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[var(--text-3)]">From</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setOffset(0); }} className={inputCls} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[var(--text-3)]">To</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setOffset(0); }} className={inputCls} />
        </div>
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo(''); setOffset(0); }}
            className="text-xs font-medium text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)] py-16 text-center">
          <p className="text-2xl mb-2">🏅</p>
          <p className="text-sm font-medium text-[var(--text-2)]">No activities logged yet.</p>
          <button onClick={() => navigate('/log-activity')}
            className="mt-3 text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors">
            Log your first activity →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map(run => (
            <ActivityRow
              key={run.id}
              run={run}
              onEdit={() => navigate(`/log-activity/${run.id}`)}
              onDelete={() => handleDelete(run.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--text-3)]">Page {currentPage} of {totalPages} · {total} total</p>
          <div className="flex gap-2">
            <button disabled={offset === 0} onClick={() => setOffset(o => o - PAGE_SIZE)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <button disabled={currentPage === totalPages} onClick={() => setOffset(o => o + PAGE_SIZE)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
