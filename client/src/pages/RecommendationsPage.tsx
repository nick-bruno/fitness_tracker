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
      <div>
        <h1 className="text-2xl font-bold text-gray-100">AI Coach</h1>
        <p className="text-sm text-gray-500">
          Get a personalized workout recommendation based on your recent history and goals.
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-300">Your Goals</p>
          <GoalSelector selected={goals} onChange={setGoals} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-300">Analyze Last</p>
          <div className="flex gap-2">
            {LOOKBACK_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setLookbackDays(days)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  lookbackDays === days
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
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
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 active:bg-indigo-700"
        >
          {isPending && <LoadingSpinner size="sm" />}
          {isPending ? 'Analyzing your history...' : '✨ Generate Recommendation'}
        </button>
      </div>

      {error && (
        <ErrorBanner message={(error as Error).message || 'Failed to get recommendation.'} />
      )}

      {data && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <RecommendationCard recommendation={data} />
        </div>
      )}

      {!data && !isPending && !error && (
        <div className="rounded-xl border border-dashed border-gray-800 py-12 text-center">
          <p className="text-gray-500">
            Select your goals and click "Generate Recommendation" to get started.
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Log at least a few workouts first for the best results.
          </p>
        </div>
      )}
    </div>
  );
}
