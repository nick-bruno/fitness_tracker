import { useState } from 'react';
import { useGoals, useGoalsHistory, useUpdateGoals } from '../../hooks/useGoals';
import type { GoalCategory, GoalsWithProgress, WeekHistoryRecord } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { GOAL_CATEGORIES, computeStats, formatWeekRange, goalOf } from './goalCategories';

interface Props {
  /** 0 = this week, 1 = next week, … */
  weekOffset: number;
  onClose: () => void;
}

export default function EditGoalsModal({ weekOffset, onClose }: Props) {
  const { data: week } = useGoals(weekOffset);
  const { data: history } = useGoalsHistory(4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl animate-fade-up">
        {week && history ? (
          <GoalsForm week={week} history={history} weekOffset={weekOffset} onClose={onClose} />
        ) : (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        )}
      </div>
    </div>
  );
}

function GoalsForm({ week, history, weekOffset, onClose }: {
  week: GoalsWithProgress; history: WeekHistoryRecord[]; weekOffset: number; onClose: () => void;
}) {
  const update = useUpdateGoals();

  // Prefill: existing goal → rounded 4-week average → 0
  const initial = Object.fromEntries(
    GOAL_CATEGORIES.map(({ key }) => {
      const existing = goalOf(week, key);
      const avg = computeStats(history, key).avgCompleted;
      return [key, String(existing ?? (avg !== null ? Math.round(avg) : 0))];
    }),
  ) as Record<GoalCategory, string>;
  const [values, setValues] = useState(initial);

  const clamp = (v: string) => Math.max(0, Math.min(99, parseInt(v) || 0));
  const step = (k: GoalCategory, d: number) =>
    setValues((v) => ({ ...v, [k]: String(clamp(String(clamp(v[k]) + d))) }));

  const handleSave = async () => {
    await update.mutateAsync({
      goals: {
        strength_goal: clamp(values.strength),
        cardio_goal: clamp(values.cardio),
        golf_goal: clamp(values.golf),
      },
      week_offset: weekOffset,
    });
    onClose();
  };

  const title = weekOffset === 0 ? 'This week’s goals' : weekOffset === 1 ? 'Plan next week' : 'Plan ahead';

  const inputCls =
    'w-16 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2 text-center text-lg font-bold text-[var(--text-1)] focus:border-indigo-400 focus:outline-none';
  const stepBtn =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] transition-colors font-medium';

  return (
    <>
      <h2 className="mb-1 font-semibold text-[var(--text-1)]">{title}</h2>
      <p className="mb-6 text-xs text-[var(--text-3)]">
        {formatWeekRange(week.week_start, week.week_end)} · How many times do you predict you’ll do each?
      </p>

      <div className="space-y-5">
        {GOAL_CATEGORIES.map((c) => {
          const avg = computeStats(history, c.key).avgCompleted;
          return (
            <div key={c.key} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-1)]">{c.icon} {c.label}</p>
                <p className="text-xs text-[var(--text-3)]">
                  {avg !== null ? `Last ${history.length} wk avg: ${avg.toFixed(1)}` : c.description}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button onClick={() => step(c.key, -1)} className={stepBtn} aria-label={`Decrease ${c.label}`}>−</button>
                <input
                  type="number" min="0" max="99" value={values[c.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [c.key]: e.target.value }))}
                  className={inputCls} aria-label={`${c.label} goal`}
                />
                <button onClick={() => step(c.key, 1)} className={stepBtn} aria-label={`Increase ${c.label}`}>+</button>
              </div>
            </div>
          );
        })}
      </div>

      {update.isError && (
        <p className="mt-4 text-xs text-red-500">Couldn’t save goals: {(update.error as Error).message}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSave} disabled={update.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 transition-all"
        >
          {update.isPending && <LoadingSpinner size="sm" />}
          Save goals
        </button>
      </div>
    </>
  );
}
