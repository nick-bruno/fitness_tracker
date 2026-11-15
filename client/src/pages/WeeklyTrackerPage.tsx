import { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { useGoals, useGoalsHistory } from '../hooks/useGoals';
import type { GoalCategory, GoalsWithProgress, WeekHistoryRecord } from '../types';
import EditGoalsModal from '../components/goals/EditGoalsModal';
import PlanningBanner from '../components/goals/PlanningBanner';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import {
  GOAL_CATEGORIES, type GoalCategoryMeta, completedOf, computeStats, formatWeekRange, goalOf, isDarkMode,
} from '../components/goals/goalCategories';

const RANGES = [8, 12, 26, 52] as const;

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ── Stat card per category ────────────────────────────────────────────────────

function StatsCard({ meta, history }: { meta: GoalCategoryMeta; history: WeekHistoryRecord[] }) {
  const s = computeStats(history, meta.key);
  const biasText = s.bias === null
    ? '—'
    : Math.abs(s.bias) < 0.25
      ? 'Spot on'
      : s.bias > 0
        ? `Over-predict by ${s.bias.toFixed(1)}`
        : `Under-predict by ${Math.abs(s.bias).toFixed(1)}`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-1)]">{meta.icon} {meta.label}</p>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.fill[0] }} />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-1)]">
        {s.hitRate === null ? '—' : `${Math.round(s.hitRate * 100)}%`}
      </p>
      <p className="text-xs text-[var(--text-3)]">
        hit rate · {s.weeksMet} of {s.weeksWithGoal} week{s.weeksWithGoal === 1 ? '' : 's'} with a goal
      </p>
      <dl className="mt-3 space-y-1 border-t border-[var(--border)] pt-3 text-xs">
        <div className="flex justify-between">
          <dt className="text-[var(--text-3)]">Current streak</dt>
          <dd className="font-medium text-[var(--text-1)]">{s.streak} wk{s.streak === 1 ? '' : 's'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--text-3)]">Prediction accuracy</dt>
          <dd className="font-medium text-[var(--text-1)]">{biasText}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--text-3)]">Avg per week</dt>
          <dd className="font-medium text-[var(--text-1)]">{s.avgCompleted === null ? '—' : s.avgCompleted.toFixed(1)}</dd>
        </div>
      </dl>
    </div>
  );
}

// ── Predicted vs actual chart ─────────────────────────────────────────────────

interface ChartPoint {
  label: string;
  range: string;
  actual: number;
  predicted: number | null;
  met: boolean | null;
  inProgress: boolean;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-[var(--text-1)]">{p.range}{p.inProgress ? ' (in progress)' : ''}</p>
      <p className="text-[var(--text-2)]">Actual: <span className="font-medium text-[var(--text-1)]">{p.actual}</span></p>
      <p className="text-[var(--text-2)]">Predicted: <span className="font-medium text-[var(--text-1)]">{p.predicted ?? 'not set'}</span></p>
    </div>
  );
}

function PredictedVsActualChart({ weeks, category }: { weeks: (GoalsWithProgress & { inProgress: boolean })[]; category: GoalCategory }) {
  const meta = GOAL_CATEGORIES.find((c) => c.key === category)!;
  const d = isDarkMode() ? 1 : 0;
  const lineColor = d ? '#E7E5E4' : '#44403C';

  const data: ChartPoint[] = weeks.map((w) => {
    const goal = goalOf(w, category);
    const actual = completedOf(w, category);
    return {
      label: shortDate(w.week_start),
      range: formatWeekRange(w.week_start, w.week_end),
      actual,
      predicted: goal,
      met: goal === null ? null : actual >= goal,
      inProgress: w.inProgress,
    };
  });

  return (
    <>
      <div className="mb-2 flex items-center gap-4 text-xs text-[var(--text-2)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: meta.fill[d] }} /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ background: lineColor }} /> Predicted
        </span>
        <span className="text-[var(--text-3)]">Faded bar = goal missed or in progress</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
          <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((p, i) => (
              <Cell key={i} fill={meta.fill[d]} fillOpacity={p.met === true && !p.inProgress ? 1 : 0.4} />
            ))}
          </Bar>
          <Line
            dataKey="predicted" type="linear" stroke={lineColor} strokeWidth={2}
            dot={{ r: 4, fill: lineColor, stroke: 'var(--bg-card)', strokeWidth: 2 }}
            activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}

// ── Table cell ────────────────────────────────────────────────────────────────

function ResultCell({ completed, goal, inProgress }: { completed: number; goal: number | null; inProgress: boolean }) {
  if (goal === null) {
    return <span className="text-[var(--text-3)]">{completed} / –</span>;
  }
  const met = completed >= goal;
  if (inProgress && !met) {
    return <span className="text-[var(--text-2)]">{completed} / {goal}</span>;
  }
  return (
    <span className={met ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
      {met ? '✓' : '✗'} {completed} / {goal}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WeeklyTrackerPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(12);
  const [category, setCategory] = useState<GoalCategory>('strength');
  const [editOffset, setEditOffset] = useState<number | null>(null);
  const { data: history, isLoading, error } = useGoalsHistory(range);
  const { data: current } = useGoals(0);

  const allWeeks = [
    ...(current ? [{ ...current, inProgress: true }] : []),
    ...(history ?? []).map((w) => ({ ...w, inProgress: false })),
  ];
  const chronological = [...allWeeks].reverse();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-1)]">Weekly Tracker</h1>
          <p className="mt-0.5 text-sm text-[var(--text-3)]">Predicted vs. actual lifts, cardio and golf, week over week.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value) as (typeof RANGES)[number])}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-sm text-[var(--text-1)]"
            aria-label="Weeks to show"
          >
            {RANGES.map((r) => <option key={r} value={r}>Last {r} weeks</option>)}
          </select>
          <button
            onClick={() => setEditOffset(1)}
            className="rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 transition-all"
          >
            Plan next week
          </button>
        </div>
      </div>

      <PlanningBanner onPlan={setEditOffset} />

      {error && <ErrorBanner message={(error as Error).message} />}

      {isLoading || !history ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <>
          <p className="text-xs text-[var(--text-3)]">
            Stats cover completed weeks only ({history.length}); the current week is shown in the chart and table as in progress.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {GOAL_CATEGORIES.map((c) => <StatsCard key={c.key} meta={c} history={history} />)}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[var(--text-1)]">Predicted vs. actual</h2>
              <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-0.5" role="tablist">
                {GOAL_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    role="tab"
                    aria-selected={category === c.key}
                    onClick={() => setCategory(c.key)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      category === c.key ? 'bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <PredictedVsActualChart weeks={chronological} category={category} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-card">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wider text-[var(--text-3)]">
                  <th className="px-4 py-2.5 font-semibold">Week</th>
                  {GOAL_CATEGORIES.map((c) => (
                    <th key={c.key} className="px-4 py-2.5 font-semibold">{c.icon} {c.label}</th>
                  ))}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {allWeeks.map((w) => (
                  <tr key={w.week_start} className="border-b border-[var(--border)] last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--text-2)]">
                      {formatWeekRange(w.week_start, w.week_end)}
                      {w.inProgress && <span className="ml-2 rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)]">in progress</span>}
                    </td>
                    {GOAL_CATEGORIES.map((c) => (
                      <td key={c.key} className="whitespace-nowrap px-4 py-2.5">
                        <ResultCell completed={completedOf(w, c.key)} goal={goalOf(w, c.key)} inProgress={w.inProgress} />
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right">
                      {w.inProgress && (
                        <button onClick={() => setEditOffset(0)} className="text-xs font-medium text-[var(--text-3)] hover:text-[var(--text-1)]">
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editOffset !== null && <EditGoalsModal weekOffset={editOffset} onClose={() => setEditOffset(null)} />}
    </div>
  );
}
