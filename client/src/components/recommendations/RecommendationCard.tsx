import type { RecommendationResponse } from '../../types';

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-900/50 text-red-300 border-red-800',
  medium: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  low: 'bg-gray-800 text-gray-400 border-gray-700',
};

interface Props {
  recommendation: RecommendationResponse;
}

export default function RecommendationCard({ recommendation: r }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Target muscle groups */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-200">Target Muscle Groups</h3>
        <div className="flex flex-col gap-2">
          {r.target_muscle_groups.map((mg) => (
            <div
              key={mg.muscle_group_name}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${PRIORITY_STYLE[mg.priority] ?? PRIORITY_STYLE.low}`}
            >
              <span className="mt-0.5 rounded px-1.5 py-0.5 text-xs font-bold uppercase">
                {mg.priority}
              </span>
              <div>
                <p className="font-medium">{mg.muscle_group_name}</p>
                <p className="text-sm opacity-80">{mg.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested workout */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-200">Suggested Workout</h3>
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Exercise
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Sets
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Reps
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Rationale
                </th>
              </tr>
            </thead>
            <tbody>
              {r.suggested_exercises.map((ex, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-800/50 bg-gray-900/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-gray-100">{ex.exercise_name}</td>
                  <td className="px-4 py-3 text-gray-300">{ex.sets}</td>
                  <td className="px-4 py-3 text-gray-300">{ex.rep_range}</td>
                  <td className="px-4 py-3 text-gray-400">{ex.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overall reasoning */}
      <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 px-4 py-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Coach's Analysis
        </p>
        <p className="text-sm leading-relaxed text-gray-300">{r.overall_reasoning}</p>
      </div>
    </div>
  );
}
