import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitbitStatus, useSyncFitbit } from '../../hooks/useFitbit';
import type { FitbitSyncResult } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Dashboard header action: syncs Fitbit in place, or links to setup when not connected. */
export default function SyncFitbitButton() {
  const navigate = useNavigate();
  const { data: status } = useFitbitStatus();
  const sync = useSyncFitbit();
  const [result, setResult] = useState<FitbitSyncResult | null>(null);

  const connected = status?.connected ?? false;

  const handleClick = async () => {
    if (!connected) return navigate('/fitbit');
    setResult(null);
    try {
      setResult(await sync.mutateAsync());
    } catch {
      /* error shown below via sync.error */
    }
  };

  let detail: ReactNode = null;
  if (sync.isError) {
    detail = <span className="text-red-500">Sync failed: {sync.error.message}</span>;
  } else if (result) {
    detail = (
      <span>
        ✓ {result.imported} new
        {result.skippedTypes.length > 0 && ` · skipped: ${result.skippedTypes.join(', ')}`}
      </span>
    );
  } else if (status && !connected) {
    detail = <span>Not connected</span>;
  } else if (status?.lastSync) {
    detail = <span>Last synced {timeAgo(status.lastSync)}</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={sync.isPending}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:from-indigo-400 hover:to-indigo-500 active:from-indigo-600 active:to-indigo-700 disabled:opacity-60 transition-all"
      >
        {sync.isPending ? <LoadingSpinner size="sm" /> : <span aria-hidden>⌚</span>}
        {sync.isPending ? 'Syncing…' : connected || !status ? 'Sync Fitbit' : 'Connect Fitbit'}
      </button>
      {detail && <p className="max-w-[260px] text-right text-xs text-[var(--text-3)]">{detail}</p>}
    </div>
  );
}
