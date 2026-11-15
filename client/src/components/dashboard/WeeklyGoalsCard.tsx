import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGoals } from '../../hooks/useGoals';
import LoadingSpinner from '../shared/LoadingSpinner';
import EditGoalsModal from '../goals/EditGoalsModal';
import PlanningBanner from '../goals/PlanningBanner';
import {
  GOAL_CATEGORIES, type GoalCategoryMeta, completedOf, formatWeekRange, goalOf, isDarkMode,
} from '../goals/goalCategories';

// ── Circular progress ring ────────────────────────────────────────────────────

interface RingProps {
  meta: GoalCategoryMeta;
  completed: number;
  goal: number | null;
  planned?: boolean;
}

function GoalRing({ meta, completed, goal, planned }: RingProps) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const progress = goal ? Math.min(completed / goal, 1) : 0;
  const offset = circ * (1 - progress);
  const done = !planned && goal !== null && goal > 0 && completed >= goal;

  const d = isDarkMode() ? 1 : 0;
  const muted = d ? '#6b7280' : '#9ca3af';
  const fill = planned ? (d ? '#4b5563' : '#d1d5db') : meta.fill[d];
  const textClr = planned ? muted : meta.text[d];

  const sublabel = goal === null
    ? 'No goal set'
    : planned
      ? `Goal: ${goal} ${meta.unit}`
      : `${completed} of ${goal} ${meta.unit}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[120px]">
        <svg viewBox="0 0 120 120" className="h-auto w-full" role="img"
          aria-label={`${meta.label}: ${completed} of ${goal ?? 'no goal'}`}>
          <defs>
            <filter id={`glow-${meta.key}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx="60" cy="60" r={r} fill="none" stroke={meta.track[d]} strokeWidth="9"/>
          <circle
            cx="60" cy="60" r={r}
            fill="none" stroke={fill} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            filter={done ? `url(#glow-${meta.key})` : undefined}
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
          />
          <text x="60" y="54" textAnchor="middle" dominantBaseline="middle"
            fill={textClr} fontSize="26" fontWeight="700" fontFamily="sans-serif">
            {planned ? '–' : completed}
          </text>
          <text x="60" y="74" textAnchor="middle" dominantBaseline="middle"
            fill="#64748b" fontSize="13" fontFamily="sans-serif">
            / {goal ?? '–'}
          </text>
        </svg>
        {done && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-xs">
            ✓
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--text-1)]">{meta.icon} {meta.label}</p>
        <p className="text-xs text-[var(--text-3)]">{sublabel}</p>
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

const MAX_FUTURE_WEEKS = 4;

/** Days remaining in the Mon–Sun week, including today */
function daysLeftInWeek(): number {
  const day = new Date().getDay(); // 0=Sun
  return day === 0 ? 1 : 8 - day;
}

export default function WeeklyGoalsCard() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: goals, isLoading } = useGoals(weekOffset);
  const [editOffset, setEditOffset] = useState<number | null>(null);

  const isFuture = weekOffset > 0;
  const daysLeft = daysLeftInWeek();

  const weekLabel = weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : `In ${weekOffset} weeks`;

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-1)]">Weekly Goals</h2>
            {goals && (
              <p className="mt-0.5 text-xs text-[var(--text-3)]">
                {formatWeekRange(goals.week_start, goals.week_end)}
                {!isFuture && ` · ${daysLeft === 1 ? 'last day' : `${daysLeft} days left`}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-1 py-0.5">
              <button
                onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                disabled={weekOffset === 0}
                className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous week"
              >‹</button>
              <span className="min-w-[64px] text-center text-xs font-medium text-[var(--text-2)]">{weekLabel}</span>
              <button
                onClick={() => setWeekOffset((o) => Math.min(MAX_FUTURE_WEEKS, o + 1))}
                disabled={weekOffset === MAX_FUTURE_WEEKS}
                className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next week"
              >›</button>
            </div>
            <button
              onClick={() => setEditOffset(weekOffset)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text-1)] transition-colors"
            >
              {isFuture ? 'Plan goals' : 'Edit goals'}
            </button>
          </div>
        </div>

        <PlanningBanner onPlan={setEditOffset} />

        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner/></div>
        ) : goals ? (
          <div className="grid grid-cols-3 gap-2 py-2">
            {GOAL_CATEGORIES.map((c) => (
              <GoalRing
                key={c.key}
                meta={c}
                completed={isFuture ? 0 : completedOf(goals, c.key)}
                goal={goalOf(goals, c.key)}
                planned={isFuture}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-4 border-t border-[var(--border)] pt-3 text-right">
          <Link to="/weekly" className="text-xs font-medium text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
            Week-over-week history →
          </Link>
        </div>
      </div>

      {editOffset !== null && (
        <EditGoalsModal weekOffset={editOffset} onClose={() => setEditOffset(null)} />
      )}
    </>
  );
}
