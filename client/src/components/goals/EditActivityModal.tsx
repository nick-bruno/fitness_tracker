import { useState } from 'react';
import { useUpdateRunDetails } from '../../hooks/useRuns';
import type { GoalActivity, GoalCategory } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
  activity: GoalActivity;
  /** cardio → title, time, distance, notes · golf → title, notes */
  category: Exclude<GoalCategory, 'strength'>;
  onClose: () => void;
}

const splitDuration = (total: number | null) => {
  const t = total ?? 0;
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
};

export default function EditActivityModal({ activity, category, onClose }: Props) {
  const update = useUpdateRunDetails();
  const showTimeDistance = category === 'cardio';

  const init = splitDuration(activity.duration_seconds);
  const [title, setTitle] = useState(activity.title ?? '');
  const [h, setH] = useState(String(init.h));
  const [m, setM] = useState(String(init.m));
  const [s, setS] = useState(String(init.s));
  const [distance, setDistance] = useState(
    activity.distance_miles != null && activity.distance_miles > 0 ? activity.distance_miles.toFixed(2) : '',
  );
  const [notes, setNotes] = useState(activity.notes ?? '');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    const data: Parameters<typeof update.mutateAsync>[0]['data'] = {
      title: title.trim() || null,
      notes: notes.trim() || null,
    };
    if (showTimeDistance) {
      const seconds = (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
      if (seconds <= 0) return setError('Total time must be greater than zero.');
      const miles = distance.trim() === '' ? null : parseFloat(distance);
      if (miles !== null && (Number.isNaN(miles) || miles < 0)) return setError('Distance must be a positive number.');
      data.duration_seconds = seconds;
      data.distance_miles = miles;
    }
    try {
      await update.mutateAsync({ id: activity.id, data });
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Failed to save.');
    }
  };

  const label = 'mb-1 block text-xs font-medium text-[var(--text-2)]';
  const input =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-indigo-400 focus:outline-none';
  const numInput = `${input} text-center`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl animate-fade-up">
        <h2 className="mb-1 font-semibold text-[var(--text-1)]">
          {category === 'golf' ? 'Golf details' : 'Cardio details'}
        </h2>
        <p className="mb-5 text-xs text-[var(--text-3)]">
          {new Date(activity.logged_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          {activity.source === 'fitbit' && ' · synced from Fitbit (your edits are kept on future syncs)'}
        </p>

        <div className="space-y-4">
          <div>
            <label className={label} htmlFor="act-title">Title</label>
            <input id="act-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={category === 'golf' ? 'e.g. Saturday round — front 9' : 'e.g. Morning tempo run'} />
          </div>

          {showTimeDistance && (
            <>
              <div>
                <span className={label}>Total time</span>
                <div className="grid grid-cols-3 gap-2">
                  {([['hr', h, setH], ['min', m, setM], ['sec', s, setS]] as const).map(([unit, val, set]) => (
                    <div key={unit} className="flex items-center gap-1.5">
                      <input type="number" min="0" max={unit === 'hr' ? 23 : 59} className={numInput}
                        value={val} onChange={(e) => set(e.target.value)} aria-label={unit} />
                      <span className="text-xs text-[var(--text-3)]">{unit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className={label} htmlFor="act-distance">Distance (miles)</label>
                <input id="act-distance" type="number" min="0" step="0.01" className={input}
                  value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="Optional" />
              </div>
            </>
          )}

          <div>
            <label className={label} htmlFor="act-notes">{category === 'golf' ? 'Details' : 'Notes'}</label>
            <textarea id="act-notes" rows={category === 'golf' ? 5 : 3} className={input}
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder={category === 'golf' ? 'Course, score, what went well, what to work on…' : 'How it felt, route, splits…'} />
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-red-500">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={update.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 transition-all">
            {update.isPending && <LoadingSpinner size="sm" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
