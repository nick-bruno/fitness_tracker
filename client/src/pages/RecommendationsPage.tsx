import { useState } from 'react';
import { useRecommendation } from '../hooks/useRecommendations';
import GoalSelector from '../components/recommendations/GoalSelector';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';

const LOOKBACK_OPTIONS = [7, 14, 30];

export default function RecommendationsPage() {
  const [goals, setGoals] = useState(['Strength', 'Muscle Balance']);
  const [lookbackDays, setLookbackDays] = useState(14);

  const { mutate, data, isPending, error } = useRecommendation();

  const handleGenerate = () => {
    if (goals.length === 0) return;
    mutate({ goals, lookback_days: lookbackDays });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-1)]">AI Coach</h1>
        <p className="mt-0.5 text-sm text-[var(--text-3)]">
          Get a personalized workout recommendation based on your recent history and goals.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-card space-y-5 animate-fade-up">
        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--text-1)]">Your Goals</p>
          <GoalSelector selected={goals} onChange={setGoals} />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--text-1)]">Analyze Last</p>
          <div className="flex gap-2">
            {LOOKBACK_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setLookbackDays(days)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  lookbackDays === days
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isPending || goals.length === 0}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 active:from-indigo-600 active:to-indigo-700 transition-all"
        >
          {isPending && <LoadingSpinner size="sm" />}
          {isPending ? 'Analyzing your history...' : '✦ Generate Recommendation'}
        </button>
      </div>

      {error && (
        <ErrorBanner message={(error as Error).message || 'Failed to get recommendation.'} />
      )}

      {data && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-card animate-fade-up">
          <RecommendationCard recommendation={data} />
        </div>
      )}

      {!data && !isPending && !error && (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-12 text-center">
          <p className="text-[var(--text-3)]">Select your goals and click "Generate Recommendation" to get started.</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">Log at least a few workouts first for the best results.</p>
        </div>
      )}
    </div>
  );
}
