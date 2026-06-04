import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRuns, useDeleteRun, useRunsSummary, useImportNrcRuns } from '../hooks/useRuns';
import type { NrcImportResult } from '../types';

interface Props {
  activityType: 'run' | 'row';
}

const labels = {
  run: { title: 'Run History', logPath: '/log-run', editPath: '/log-run', noun: 'Run', nounPlural: 'Runs', logLabel: '+ Log Run', emptyMsg: 'No runs logged yet.', emptyLink: 'Log your first run →', color: 'text-emerald-400' },
  row: { title: 'Row History', logPath: '/log-row', editPath: '/log-row', noun: 'Row', nounPlural: 'Rows', logLabel: '+ Log Row', emptyMsg: 'No rows logged yet.', emptyLink: 'Log your first row →', color: 'text-sky-400' },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(durationSeconds: number, distanceMiles: number): string {
  if (distanceMiles === 0) return '--';
  const paceSeconds = durationSeconds / distanceMiles;
  const m = Math.floor(paceSeconds / 60);
  const s = Math.round(paceSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}/mi`;
}

const PAGE_SIZE = 10;

export default function CardioHistoryPage({ activityType }: Props) {
  const navigate = useNavigate();
  const l = labels[activityType];
  const [offset, setOffset] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useRuns({
    limit: PAGE_SIZE,
    offset,
    type: activityType,
    from: from || undefined,
    to: to || undefined,
  });
  const { data: summary } = useRunsSummary(7, activityType);
  const deleteMutation = useDeleteRun();
  const importMutation = useImportNrcRuns();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<NrcImportResult | null>(null);

  const runs = data?.runs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete this ${l.noun.toLowerCase()}?`)) return;
    await deleteMutation.mutateAsync(id);
    if (runs.length === 1 && offset > 0) setOffset(offset - PAGE_SIZE);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{l.title}</h1>
          <p className="text-sm text-gray-500">Your cardio log.</p>
        </div>
        <button
          onClick={() => navigate(l.logPath)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {l.logLabel}
        </button>
      </div>

      {/* 7-day summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className={`text-3xl font-bold ${l.color}`}>{summary?.total_runs ?? 0}</p>
          <p className="mt-1 text-xs text-gray-500">{l.nounPlural} this week</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className={`text-3xl font-bold ${l.color}`}>{(summary?.total_miles ?? 0).toFixed(1)}</p>
          <p className="mt-1 text-xs text-gray-500">Miles this week</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className={`text-3xl font-bold ${l.color}`}>
            {summary && summary.total_runs > 0
              ? formatPace(summary.total_seconds, summary.total_miles)
              : '--'}
          </p>
          <p className="mt-1 text-xs text-gray-500">Avg pace this week</p>
        </div>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setOffset(0); }}
            className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setOffset(0); }}
            className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        {(from || to) && (
          <button
            onClick={() => { setFrom(''); setTo(''); setOffset(0); }}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Activity list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 py-12 text-center">
          <p className="text-gray-500">{l.emptyMsg}</p>
          <button
            onClick={() => navigate(l.logPath)}
            className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
          >
            {l.emptyLink}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {runs.map((run) => (
            <div key={run.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-100">{run.title ?? l.noun}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(run.logged_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`${l.editPath}/${run.id}`)}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(run.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-6">
                <div>
                  <p className={`text-xl font-bold ${l.color}`}>{run.distance_miles.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">miles</p>
                </div>
                <div>
                  <p className={`text-xl font-bold ${l.color}`}>{formatDuration(run.duration_seconds)}</p>
                  <p className="text-xs text-gray-500">duration</p>
                </div>
                <div>
                  <p className={`text-xl font-bold ${l.color}`}>{formatPace(run.duration_seconds, run.distance_miles)}</p>
                  <p className="text-xs text-gray-500">avg pace</p>
                </div>
              </div>
              {run.notes && (
                <p className="mt-2 text-xs italic text-gray-400">{run.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* NRC Import — runs only */}
      {activityType === 'run' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900">
          <button
            onClick={() => { setImportOpen((o) => !o); setImportResult(null); }}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-gray-300 hover:text-gray-100"
          >
            <span>Import from Nike Run Club</span>
            <span className="text-gray-500">{importOpen ? '▲' : '▼'}</span>
          </button>

          {importOpen && (
            <div className="space-y-4 border-t border-gray-800 px-5 pb-5 pt-4">
              <ol className="space-y-1 text-xs text-gray-400 list-decimal list-inside">
                <li>Open the NRC app → Profile → Settings → <span className="text-gray-300">Download Your Data</span></li>
                <li>Nike will email you a <span className="font-mono text-gray-300">.zip</span> file — download it</li>
                <li>Upload that <span className="font-mono text-gray-300">.zip</span> below</li>
              </ol>

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImportResult(null);
                    try {
                      const result = await importMutation.mutateAsync(file);
                      setImportResult(result);
                    } catch {
                      // error shown via importMutation.error
                    }
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importMutation.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {importMutation.isPending ? 'Importing…' : 'Choose .zip file'}
                </button>
              </div>

              {importResult && (
                <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs space-y-1">
                  <p className="text-emerald-400 font-medium">
                    ✓ Imported {importResult.imported} run{importResult.imported !== 1 ? 's' : ''}
                    {importResult.skipped > 0 && `, skipped ${importResult.skipped} duplicate${importResult.skipped !== 1 ? 's' : ''}`}
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-1 text-yellow-400">
                      <p className="font-medium">Warnings ({importResult.errors.length}):</p>
                      <ul className="mt-0.5 list-disc list-inside space-y-0.5 text-gray-400">
                        {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {importMutation.error && !importResult && (
                <p className="text-xs text-red-400">{importMutation.error.message}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
