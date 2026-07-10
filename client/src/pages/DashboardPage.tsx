import { useNavigate } from 'react-router-dom';
import { useWorkouts, useMuscleSummary } from '../hooks/useWorkouts';
import { useRunsSummary } from '../hooks/useRuns';
import { useFitbitSteps } from '../hooks/useFitbit';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import WorkoutSummaryCard from '../components/workout/WorkoutSummaryCard';
import MuscleHeatmap from '../components/recommendations/MuscleHeatmap';
import BodySilhouette from '../components/dashboard/BodySilhouette';
import WeeklyGoalsCard from '../components/dashboard/WeeklyGoalsCard';
import { StatSkeleton, WorkoutCardSkeleton } from '../components/shared/Skeleton';
import ErrorBanner from '../components/shared/ErrorBanner';

function formatPace(durationSeconds: number, distanceMiles: number): string {
  if (distanceMiles === 0) return '--';
  const paceSeconds = durationSeconds / distanceMiles;
  const m = Math.floor(paceSeconds / 60);
  const s = Math.round(paceSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}/mi`;
}

function StatCard({ value, label, color = 'indigo' }: { value: string | number; label: string; color?: 'indigo' | 'emerald' | 'sky' }) {
  const valueColor = color === 'emerald' ? 'text-emerald-600' : color === 'sky' ? 'text-sky-600' : 'text-indigo-600';
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center shadow-card animate-fade-up">
      <p className={`text-3xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">{label}</p>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">{label}</p>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: workoutsData, isLoading: loadingWorkouts, error } = useWorkouts({ limit: 3, offset: 0 });
  const { data: muscleSummary, isLoading: loadingMuscles } = useMuscleSummary(7);
  const { data: runSummary } = useRunsSummary(7, 'run');
  const { data: rowSummary } = useRunsSummary(7, 'row');
  const { data: stepsData } = useFitbitSteps(7);

  const stepsChartData = (stepsData ?? []).map((d) => ({
    day: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    steps: d.steps,
    isToday: d.date === new Date().toISOString().slice(0, 10),
  }));
  const showSteps = stepsChartData.some((d) => d.steps > 0);

  const workouts = workoutsData?.workouts ?? [];
  const thisWeekWorkouts = workouts.filter((w) => {
    const diff = (Date.now() - new Date(w.logged_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-1)]">Dashboard</h1>
          <p className="mt-0.5 text-sm text-[var(--text-3)]">Track your progress and plan your next session.</p>
        </div>
        <button
          onClick={() => navigate('/log')}
          className="rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:from-indigo-400 hover:to-indigo-500 active:from-indigo-600 active:to-indigo-700 transition-all"
        >
          + Log Workout
        </button>
      </div>

      {/* Weekly goals */}
      <WeeklyGoalsCard />

      {/* Strength stats */}
      <div>
        <SectionHeader label="This Week — Strength" />
        <div className="grid grid-cols-3 gap-4 stagger">
          <StatCard value={thisWeekWorkouts.length} label="Workouts" />
          <StatCard value={thisWeekWorkouts.reduce((s, w) => s + w.total_sets, 0)} label="Total sets" />
          <StatCard value={workoutsData?.total ?? 0} label="All-time workouts" />
        </div>
      </div>

      {/* Running stats */}
      <div>
        <SectionHeader label="This Week — Running" />
        <div className="grid grid-cols-3 gap-4 stagger">
          <StatCard value={runSummary?.total_runs ?? 0} label="Runs" color="emerald" />
          <StatCard value={(runSummary?.total_miles ?? 0).toFixed(1)} label="Miles" color="emerald" />
          <StatCard
            value={runSummary && runSummary.total_runs > 0 ? formatPace(runSummary.total_seconds, runSummary.total_miles) : '--'}
            label="Avg pace" color="emerald"
          />
        </div>
      </div>

      {/* Rowing stats */}
      <div>
        <SectionHeader label="This Week — Rowing" />
        <div className="grid grid-cols-3 gap-4 stagger">
          <StatCard value={rowSummary?.total_runs ?? 0} label="Rows" color="sky" />
          <StatCard value={(rowSummary?.total_miles ?? 0).toFixed(1)} label="Miles" color="sky" />
          <StatCard
            value={rowSummary && rowSummary.total_runs > 0 ? formatPace(rowSummary.total_seconds, rowSummary.total_miles) : '--'}
            label="Avg pace" color="sky"
          />
        </div>
      </div>

      {/* Daily steps — only shown when Fitbit steps data is available */}
      {showSteps && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-card animate-fade-up">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-1)]">Daily Steps</h2>
            <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-3)]">via Fitbit</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={stepsChartData} barCategoryGap="30%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'var(--bg-hover)' }}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [v.toLocaleString(), 'Steps']}
              />
              <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                {stepsChartData.map((d, i) => (
                  <Cell key={i} fill={d.isToday ? '#6366f1' : 'var(--bg-subtle)'} stroke={d.isToday ? '#4f46e5' : 'var(--border)'} strokeWidth={1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-right text-xs text-[var(--text-3)]">
            {stepsChartData.reduce((s, d) => s + d.steps, 0).toLocaleString()} steps this week
          </p>
        </div>
      )}

      {/* Muscle coverage */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-card animate-fade-up">
        <h2 className="mb-4 text-base font-semibold text-[var(--text-1)]">7-Day Muscle Coverage</h2>
        {loadingMuscles ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3 w-16" />
                <div className="flex gap-2">
                  {[1,2,3].map(j => <div key={j} className="skeleton h-6 w-20 rounded-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <MuscleHeatmap summary={muscleSummary ?? []} />
            <div className="mt-6">
              <BodySilhouette summary={muscleSummary ?? []} />
            </div>
          </>
        )}
      </div>

      {/* Recent workouts */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-1)]">Recent Workouts</h2>
          <button onClick={() => navigate('/history')} className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            View all →
          </button>
        </div>

        {error && <ErrorBanner message="Failed to load workouts." />}

        {loadingWorkouts ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <WorkoutCardSkeleton key={i} />)}
          </div>
        ) : workouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-12 text-center">
            <p className="text-[var(--text-3)]">No workouts yet.</p>
            <button onClick={() => navigate('/log')} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Log your first workout →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 stagger">
            {workouts.map((w) => <WorkoutSummaryCard key={w.id} workout={w} />)}
          </div>
        )}
      </div>
    </div>
  );
}
