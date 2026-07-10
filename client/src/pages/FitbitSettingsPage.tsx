import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFitbitStatus, useSyncFitbit, useDisconnectFitbit } from '../hooks/useFitbit';
import { fetchFitbitAuthUrl } from '../api/client';
import type { FitbitSyncResult } from '../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function FitbitSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const justConnected = searchParams.get('connected') === 'true';
  const authError = searchParams.get('error');

  const { data: status, isLoading: loadingStatus } = useFitbitStatus();
  const syncMutation = useSyncFitbit();
  const disconnectMutation = useDisconnectFitbit();

  const [syncResult, setSyncResult] = useState<FitbitSyncResult | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    if (justConnected || authError) {
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const url = await fetchFitbitAuthUrl();
      window.location.href = url;
    } catch {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncResult(null);
    const result = await syncMutation.mutateAsync();
    setSyncResult(result);
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Fitbit? Your synced activities will remain in the app.')) return;
    await disconnectMutation.mutateAsync();
    setSyncResult(null);
  };

  const isConnected = status?.connected ?? false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Fitbit Integration</h1>
        <p className="mt-1 text-sm text-[var(--text-3)]">Sync your workouts and daily steps from Fitbit.</p>
      </div>

      {/* Success / error banners from OAuth redirect */}
      {justConnected && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
          <span className="text-emerald-600 dark:text-emerald-400 text-lg">✓</span>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Fitbit connected successfully! Click "Sync Now" to import your activities.</p>
        </div>
      )}
      {authError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <span className="text-red-500 text-lg">✕</span>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {authError === 'access_denied' ? 'Authorization was cancelled.' : 'Connection failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Connection card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-lg">
              ⌚
            </div>
            <div>
              <p className="font-semibold text-[var(--text-1)]">Fitbit Account</p>
              {loadingStatus ? (
                <div className="mt-1 h-4 w-24 animate-pulse rounded bg-[var(--bg-subtle)]" />
              ) : (
                <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-3)]'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-[var(--text-3)]'}`} />
                  {isConnected ? 'Connected' : 'Not connected'}
                </span>
              )}
            </div>
          </div>

          {!loadingStatus && (
            isConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="rounded-lg border border-red-200 dark:border-red-800/40 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
              >
                {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 transition-all"
              >
                {connecting ? 'Redirecting…' : 'Connect Fitbit'}
              </button>
            )
          )}
        </div>

        {isConnected && status?.lastSync && (
          <p className="mt-4 text-xs text-[var(--text-3)]">Last synced: {formatDate(status.lastSync)}</p>
        )}
      </div>

      {/* Sync card — visible when connected */}
      {isConnected && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[var(--text-1)]">Sync Activities</p>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">Imports the last 30 days of activities and 7 days of step data.</p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 transition-all"
            >
              {syncMutation.isPending ? 'Syncing…' : 'Sync Now'}
            </button>
          </div>

          {syncMutation.error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {syncMutation.error.message}
            </div>
          )}

          {syncResult && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4 space-y-2">
              <div className="flex gap-4 text-sm">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ {syncResult.imported} imported
                </span>
                {syncResult.skipped > 0 && (
                  <span className="text-[var(--text-3)]">{syncResult.skipped} already synced</span>
                )}
              </div>
              {syncResult.skippedTypes.length > 0 && (
                <p className="text-xs text-[var(--text-3)]">
                  Unrecognized types skipped: {syncResult.skippedTypes.join(', ')}
                </p>
              )}
              {syncResult.errors.length > 0 && (
                <details className="text-xs text-amber-600 dark:text-amber-400">
                  <summary className="cursor-pointer font-medium">{syncResult.errors.length} warnings</summary>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-[var(--text-3)]">
                    {syncResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="text-xs text-[var(--text-3)] space-y-1">
            <p className="font-medium text-[var(--text-2)]">What gets synced:</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Runs, rows, cycling, swimming, walking, tennis, golf, pickleball</li>
              <li>Daily step counts (last 7 days) — visible on the Dashboard</li>
              <li>Duplicate activities are automatically skipped</li>
            </ul>
          </div>
        </div>
      )}

      {/* Setup instructions */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <button
          onClick={() => setInstructionsOpen(o => !o)}
          className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
        >
          <span>{isConnected ? 'Setup reference' : 'How to connect — setup guide'}</span>
          <span className="text-[var(--text-3)] text-xs">{instructionsOpen ? '▲' : '▼'}</span>
        </button>

        {instructionsOpen && (
          <div className="border-t border-[var(--border)] px-6 pb-6 pt-4 space-y-4">
            <p className="text-sm font-medium text-[var(--text-2)]">One-time developer app setup:</p>
            <ol className="space-y-3 text-sm text-[var(--text-3)]">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">1</span>
                <span>Go to <span className="font-mono text-[var(--text-2)]">dev.fitbit.com/apps/new</span> and register a free app. Set <strong>OAuth 2.0 Application Type</strong> to <strong>Server</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">2</span>
                <span>Set the <strong>Redirect URI</strong> to <span className="font-mono text-[var(--text-2)]">http://localhost:3001/api/fitbit/callback</span></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">3</span>
                <span>Enable the <strong>Activity</strong> scope.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">4</span>
                <span>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> into your <span className="font-mono text-[var(--text-2)]">.env</span> file:</span>
              </li>
            </ol>
            <pre className="rounded-lg bg-[var(--bg-subtle)] px-4 py-3 text-xs font-mono text-[var(--text-2)] overflow-x-auto">
{`FITBIT_CLIENT_ID=your_client_id_here
FITBIT_CLIENT_SECRET=your_client_secret_here
FITBIT_REDIRECT_URI=http://localhost:3001/api/fitbit/callback`}
            </pre>
            <p className="text-xs text-[var(--text-3)]">Restart the server after adding the env vars, then click "Connect Fitbit" above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
