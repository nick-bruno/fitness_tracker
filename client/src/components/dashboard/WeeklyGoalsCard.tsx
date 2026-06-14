import { useState } from 'react';
import { useGoals, useGoalsHistory, useUpdateGoals } from '../../hooks/useGoals';
import type { WeekHistoryRecord } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

// ── Circular progress ring ────────────────────────────────────────────────────

interface RingProps {
  label: string;
  sublabel: string;
  completed: number;
  goal: number;
  color: 'indigo' | 'emerald';
}

function GoalRing({ label, sublabel, completed, goal, color }: RingProps) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const progress = goal > 0 ? Math.min(completed / goal, 1) : 0;
  const offset = circ * (1 - progress);
  const done = completed >= goal && goal > 0;

  const track  = color === 'indigo' ? '#1e1b4b' : '#022c22';
  const fill   = done
    ? (color === 'indigo' ? '#a5b4fc' : '#6ee7b7')
    : (color === 'indigo' ? '#6366f1'  : '#10b981');
  const glow   = done
    ? (color === 'indigo' ? '#818cf8' : '#34d399')
    : fill;
  const textClr = done
    ? (color === 'indigo' ? '#c7d2fe' : '#a7f3d0')
    : '#f1f5f9';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <defs>
            <filter id={`glow-${color}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx="60" cy="60" r={r} fill="none" stroke={track} strokeWidth="9"/>
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke={glow}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            filter={done ? `url(#glow-${color})` : undefined}
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Completed number */}
          <text
            x="60" y="54"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textClr}
            fontSize="26"
            fontWeight="700"
            fontFamily="sans-serif"
          >
            {completed}
          </text>
          {/* Denominator */}
          <text
            x="60" y="74"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#64748b"
            fontSize="13"
            fontFamily="sans-serif"
          >
            / {goal}
          </text>
        </svg>
        {done && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs">
            ✓
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-200">{label}</p>
        <p className="text-xs text-gray-500">{sublabel}</p>
      </div>
    </div>
  );
}

// ── Edit goals modal ──────────────────────────────────────────────────────────

interface EditProps {
  strengthGoal: number;
  cardioGoal: number;
  onSave: (s: number, c: number) => void;
  onClose: () => void;
  saving: boolean;
}

function EditGoalsModal({ strengthGoal, cardioGoal, onSave, onClose, saving }: EditProps) {
  const [s, setS] = useState(String(strengthGoal));
  const [c, setC] = useState(String(cardioGoal));

  const handleSave = () => {
    const sv = Math.max(0, Math.min(99, parseInt(s) || 0));
    const cv = Math.max(0, Math.min(99, parseInt(c) || 0));
    onSave(sv, cv);
  };

  const inputCls =
    'w-20 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-center text-lg font-bold text-gray-100 focus:border-indigo-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <h2 className="mb-1 font-semibold text-gray-100">Weekly Goals</h2>
        <p className="mb-6 text-xs text-gray-500">Set your targets for Mon – Sun.</p>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-200">Strength workouts</p>
              <p className="text-xs text-gray-500">Sessions logged per week</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setS(v => String(Math.max(0, (parseInt(v) || 0) - 1)))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              >−</button>
              <input type="number" min="0" max="99" value={s}
                onChange={e => setS(e.target.value)} className={inputCls}/>
              <button
                onClick={() => setS(v => String(Math.min(99, (parseInt(v) || 0) + 1)))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              >+</button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-200">Cardio workouts</p>
              <p className="text-xs text-gray-500">Runs + rows logged per week</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setC(v => String(Math.max(0, (parseInt(v) || 0) - 1)))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              >−</button>
              <input type="number" min="0" max="99" value={c}
                onChange={e => setC(e.target.value)} className={inputCls}/>
              <button
                onClick={() => setC(v => String(Math.min(99, (parseInt(v) || 0) + 1)))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              >+</button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm"/>}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

function formatWeekRange(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const f = new Date(from).toLocaleDateString('en-US', opts);
  const t = new Date(to).toLocaleDateString('en-US', opts);
  return `${f} – ${t}`;
}

// ── History row ───────────────────────────────────────────────────────────────

function HistoryRow({ record }: { record: WeekHistoryRecord }) {
  const bothMet = record.strength_met && record.cardio_met;
  const label = formatWeekRange(record.week_start, record.week_end);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2.5">
      {/* Overall indicator */}
      <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        bothMet ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/40 text-red-400'
      }`}>
        {bothMet ? '✓' : '✗'}
      </span>

      {/* Week label */}
      <span className="w-28 flex-shrink-0 text-xs text-gray-400">{label}</span>

      {/* Strength pill */}
      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        record.strength_met
          ? 'bg-indigo-900/50 text-indigo-300'
          : 'bg-gray-700/60 text-gray-400'
      }`}>
        <span className="opacity-60">💪</span>
        {record.strength_completed}/{record.strength_goal}
      </span>

      {/* Cardio pill */}
      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        record.cardio_met
          ? 'bg-emerald-900/50 text-emerald-300'
          : 'bg-gray-700/60 text-gray-400'
      }`}>
        <span className="opacity-60">🏃</span>
        {record.cardio_completed}/{record.cardio_goal}
      </span>
    </div>
  );
}

export default function WeeklyGoalsCard() {
  const { data: goals, isLoading } = useGoals();
  const { data: history } = useGoalsHistory(12);
  const updateMutation = useUpdateGoals();
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSave = async (strength_goal: number, cardio_goal: number) => {
    await updateMutation.mutateAsync({ strength_goal, cardio_goal });
    setEditing(false);
  };

  return (
    <>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-200">Weekly Goals</h2>
            {goals && (
              <p className="mt-0.5 text-xs text-gray-500">
                {formatWeekRange(goals.week_start, goals.week_end)}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-200"
          >
            Edit goals
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner/>
          </div>
        ) : goals ? (
          <div className="flex justify-around py-2">
            <GoalRing
              label="Strength"
              sublabel={`${goals.strength_completed} of ${goals.strength_goal} workouts`}
              completed={goals.strength_completed}
              goal={goals.strength_goal}
              color="indigo"
            />
            <GoalRing
              label="Cardio"
              sublabel={`${goals.cardio_completed} of ${goals.cardio_goal} sessions`}
              completed={goals.cardio_completed}
              goal={goals.cardio_goal}
              color="emerald"
            />
          </div>
        ) : null}

        {/* History toggle */}
        {history && history.length > 0 && (
          <div className="mt-4 border-t border-gray-800 pt-4">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="flex w-full items-center justify-between text-xs text-gray-500 hover:text-gray-300"
            >
              <span className="font-medium uppercase tracking-wider">
                Goal History ({history.length} week{history.length !== 1 ? 's' : ''})
              </span>
              <span>{showHistory ? '▲' : '▼'}</span>
            </button>

            {showHistory && (
              <div className="mt-3 space-y-1.5">
                {history.map(r => (
                  <HistoryRow key={r.week_start} record={r} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editing && goals && (
        <EditGoalsModal
          strengthGoal={goals.strength_goal}
          cardioGoal={goals.cardio_goal}
          onSave={handleSave}
          onClose={() => setEditing(false)}
          saving={updateMutation.isPending}
        />
      )}
    </>
  );
}
