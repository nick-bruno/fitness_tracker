import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRun, useCreateRun, useUpdateRun } from '../hooks/useRuns';
import type { ActivityType, RunCreateInput } from '../types';

const ACTIVITY_OPTIONS: { type: ActivityType; label: string; emoji: string; color: string }[] = [
  { type: 'tennis',     label: 'Tennis',     emoji: '🎾', color: 'indigo' },
  { type: 'golf',       label: 'Golf',       emoji: '⛳', color: 'emerald' },
  { type: 'pickleball', label: 'Pickleball', emoji: '🏓', color: 'amber' },
  { type: 'cycle',      label: 'Cycling',    emoji: '🚴', color: 'sky' },
  { type: 'swim',       label: 'Swimming',   emoji: '🏊', color: 'teal' },
  { type: 'walk',       label: 'Walking',    emoji: '🚶', color: 'violet' },
];

function toLocalDatetimeString(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LogActivityPage() {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId?: string }>();
  const editId = activityId ? parseInt(activityId) : undefined;
  const isEdit = editId != null;

  const { data: existingRun, isLoading: loadingRun } = useRun(editId);
  const createMutation = useCreateRun();
  const updateMutation = useUpdateRun();

  const [activityType, setActivityType] = useState<ActivityType>('tennis');
  const [loggedAt, setLoggedAt] = useState(() => toLocalDatetimeString(new Date().toISOString()));
  const [durationHours, setDurationHours] = useState('0');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingRun) {
      if (ACTIVITY_OPTIONS.some(o => o.type === existingRun.type)) {
        setActivityType(existingRun.type as ActivityType);
      }
      setLoggedAt(toLocalDatetimeString(existingRun.logged_at));
      const totalMins = Math.floor(existingRun.duration_seconds / 60);
      setDurationHours(String(Math.floor(totalMins / 60)));
      setDurationMinutes(String(totalMins % 60));
      setNotes(existingRun.notes ?? '');
    }
  }, [existingRun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const hours = parseInt(durationHours || '0');
    const mins  = parseInt(durationMinutes || '0');
    const totalSeconds = (hours * 60 + mins) * 60;

    if (totalSeconds <= 0) {
      setError('Please enter a duration of at least 1 minute.');
      return;
    }

    const option = ACTIVITY_OPTIONS.find(o => o.type === activityType)!;
    const data: RunCreateInput = {
      type: activityType,
      title: option.label,
      logged_at: new Date(loggedAt).toISOString(),
      duration_seconds: totalSeconds,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEdit && editId != null) {
        await updateMutation.mutateAsync({ id: editId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate('/activities');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (isEdit && loadingRun) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-indigo-500" />
      </div>
    );
  }

  const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/30';
  const labelCls = 'block text-sm font-medium text-[var(--text-2)] mb-1.5';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">
          {isEdit ? 'Edit Activity' : 'Log Activity'}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-3)]">
          {isEdit ? 'Update your activity details.' : 'Record time spent on a recreational activity.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Activity type selector */}
        <div>
          <label className={labelCls}>Activity</label>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const active = activityType === opt.type;
              const colorMap: Record<string, string> = {
                indigo:  active ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : '',
                emerald: active ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : '',
                amber:   active ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : '',
                sky:     active ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' : '',
                teal:    active ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : '',
                violet:  active ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : '',
              };
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setActivityType(opt.type)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 text-sm font-semibold transition-all ${
                    active
                      ? colorMap[opt.color]
                      : 'border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & time */}
        <div>
          <label htmlFor="loggedAt" className={labelCls}>Date & Time</label>
          <input
            id="loggedAt"
            type="datetime-local"
            value={loggedAt}
            onChange={e => setLoggedAt(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label className={labelCls}>Duration</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="23"
                value={durationHours}
                onChange={e => setDurationHours(e.target.value)}
                className={`${inputCls} w-20 text-center`}
                placeholder="0"
              />
              <span className="text-sm text-[var(--text-3)]">hr</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="59"
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
                className={`${inputCls} w-20 text-center`}
                placeholder="0"
              />
              <span className="text-sm text-[var(--text-3)]">min</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className={labelCls}>Notes <span className="text-[var(--text-3)] font-normal">(optional)</span></label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Who did you play with? How did it go?"
            className={`${inputCls} resize-none`}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/activities')}
            className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text-1)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 transition-all"
          >
            {isEdit ? 'Save Changes' : 'Log Activity'}
          </button>
        </div>
      </form>
    </div>
  );
}
