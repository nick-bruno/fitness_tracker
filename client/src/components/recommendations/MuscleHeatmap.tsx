import type { MuscleVolumeSummary } from '../../types';

interface Props {
  summary: MuscleVolumeSummary[];
}

function getHeatColor(sets: number, lastTrained: string | null): string {
  if (!lastTrained || sets === 0) return 'bg-gray-800 text-gray-600';

  const daysSince = (Date.now() - new Date(lastTrained).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince <= 1) return 'bg-red-700 text-red-100';
  if (daysSince <= 2) return 'bg-orange-700 text-orange-100';
  if (daysSince <= 4) return 'bg-yellow-700 text-yellow-100';
  if (daysSince <= 7) return 'bg-green-800 text-green-100';
  return 'bg-gray-700 text-gray-300';
}

const PARENT_ORDER = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

export default function MuscleHeatmap({ summary }: Props) {
  const byParent = new Map<string, MuscleVolumeSummary[]>();
  for (const s of summary) {
    if (!s.parent_name) continue;
    if (!byParent.has(s.parent_name)) byParent.set(s.parent_name, []);
    byParent.get(s.parent_name)!.push(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-red-700" /> Trained today
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-yellow-700" /> 3–4 days ago
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-green-800" /> This week
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-gray-700" /> Over a week ago
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-gray-800" /> Not trained
        </span>
      </div>

      {PARENT_ORDER.map((parent) => {
        const muscles = byParent.get(parent);
        if (!muscles) return null;
        return (
          <div key={parent}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {parent}
            </p>
            <div className="flex flex-wrap gap-2">
              {muscles.map((m) => (
                <div
                  key={m.muscle_group_name}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${getHeatColor(m.total_sets, m.last_trained_date)}`}
                  title={`${m.total_sets} sets · last: ${m.last_trained_date ?? 'never'}`}
                >
                  {m.muscle_group_name}
                  {m.total_sets > 0 && (
                    <span className="ml-1 opacity-70">{m.total_sets}s</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
