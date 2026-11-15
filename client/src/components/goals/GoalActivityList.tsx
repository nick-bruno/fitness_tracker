import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityType, GoalActivity } from '../../types';
import type { GoalCategoryMeta } from './goalCategories';
import EditActivityModal from './EditActivityModal';

const TYPE_LABELS: Record<ActivityType, string> = {
  run: 'Run',
  row: 'Rowing',
  cycle: 'Bike',
  tennis: 'Tennis',
  basketball: 'Basketball',
  golf: 'Golf',
  driving_range: 'Driving range',
  strength: 'Strength training',
  swim: 'Swim',
  walk: 'Walk',
  pickleball: 'Pickleball',
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

interface Props {
  meta: GoalCategoryMeta;
  activities: GoalActivity[] | undefined;
  loading: boolean;
}

/** Itemised sessions behind one goal ring for the selected week. */
export default function GoalActivityList({ meta, activities, loading }: Props) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState<GoalActivity | null>(null);

  /** Strength → workout editor (title, exercises, sets); cardio/golf → details modal */
  const openDetails = (a: GoalActivity) => {
    if (meta.key !== 'strength') return setEditing(a);
    if (a.workout_id) return navigate(`/log/${a.workout_id}`);
    navigate(`/log?activity=${a.id}&at=${encodeURIComponent(a.logged_at)}`);
  };
  const hasDetails = (a: GoalActivity) =>
    meta.key === 'strength' ? a.workout_id != null : !!(a.notes || (a.title && a.title !== TYPE_LABELS[a.type]));

  const totalSeconds = (activities ?? []).reduce((s, a) => s + (a.duration_seconds ?? 0), 0);

  return (
    <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3 animate-fade-up">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
          {meta.icon} {meta.label} sessions
        </p>
        {activities && activities.length > 0 && totalSeconds > 0 && (
          <p className="text-xs text-[var(--text-3)]">{formatDuration(totalSeconds)} total</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
        </div>
      ) : !activities || activities.length === 0 ? (
        <p className="px-1 py-3 text-sm text-[var(--text-3)]">
          No {meta.label.toLowerCase()} sessions this week yet. ({meta.description} count here.)
        </p>
      ) : (
        <ul className="space-y-1.5">
          {activities.map((a) => {
            const typeLabel = TYPE_LABELS[a.type] ?? a.type;
            const name = a.workout_title || a.title || typeLabel;
            const showType = name.toLowerCase() !== typeLabel.toLowerCase();
            return (
              <li
                key={`${a.kind}-${a.id}`}
                className="flex items-start gap-3 rounded-lg bg-[var(--bg-card)] px-3 py-2.5"
              >
                <span className="h-8 w-1 flex-shrink-0 self-start rounded-full mt-0.5" style={{ background: meta.fill[0] }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-1)]">
                    {name}
                    {showType && <span className="ml-1.5 text-xs font-normal text-[var(--text-3)]">{typeLabel}</span>}
                  </p>
                  <p className="text-xs text-[var(--text-3)]">
                    {formatWhen(a.logged_at)}
                    {a.source === 'fitbit' ? ' · Fitbit' : a.kind === 'workout' ? ' · Logged workout' : ' · Manual'}
                  </p>
                  {a.exercise_names && (
                    <p className="mt-0.5 truncate text-xs text-[var(--text-2)]">
                      {a.exercise_names}{a.set_count ? ` · ${a.set_count} sets` : ''}
                    </p>
                  )}
                  {a.notes && (
                    <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-xs text-[var(--text-2)]">{a.notes}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 flex-col items-end text-right text-xs">
                  {a.duration_seconds != null && (
                    <p className="font-medium text-[var(--text-1)]">{formatDuration(a.duration_seconds)}</p>
                  )}
                  {a.distance_miles != null && a.distance_miles > 0 && (
                    <p className="text-[var(--text-3)]">{a.distance_miles.toFixed(2)} mi</p>
                  )}
                  <button
                    onClick={() => openDetails(a)}
                    className="mt-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text-1)] transition-colors"
                  >
                    {hasDetails(a) ? 'Edit' : 'Add details'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && meta.key !== 'strength' && (
        <EditActivityModal activity={editing} category={meta.key} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
