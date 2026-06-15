import type { MuscleVolumeSummary } from '../../types';

interface Props {
  summary: MuscleVolumeSummary[];
}

function getHeatColor(sets: number, lastTrained: string | null): string {
  if (!lastTrained || sets === 0) return 'bg-[var(--bg-subtle)] text-[var(--text-3)] ring-1 ring-[var(--border)]';
  const daysSince = (Date.now() - new Date(lastTrained).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 1) return 'bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-800/40';
  if (daysSince <= 2) return 'bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-800/40';
  if (daysSince <= 4) return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800/40';
  if (daysSince <= 7) return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800/40';
  return 'bg-[var(--bg-subtle)] text-[var(--text-2)] ring-1 ring-[var(--border)]';
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
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-3)]">
        {[
          { cls: 'bg-red-100 ring-1 ring-red-200', label: 'Today' },
          { cls: 'bg-orange-100 ring-1 ring-orange-200', label: 'Yesterday' },
          { cls: 'bg-amber-100 ring-1 ring-amber-200', label: '3–4 days ago' },
          { cls: 'bg-emerald-100 ring-1 ring-emerald-200', label: 'This week' },
          { cls: 'bg-[var(--bg-subtle)] ring-1 ring-\[var(--border)\]', label: 'Not trained' },
        ].map(({ cls, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
            {label}
          </span>
        ))}
      </div>

      {PARENT_ORDER.map((parent) => {
        const muscles = byParent.get(parent);
        if (!muscles) return null;
        return (
          <div key={parent}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-3)]">
              {parent}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {muscles.map((m) => (
                <div
                  key={m.muscle_group_name}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${getHeatColor(m.total_sets, m.last_trained_date)}`}
                  title={`${m.total_sets} sets · last: ${m.last_trained_date ?? 'never'}`}
                >
                  {m.muscle_group_name}
                  {m.total_sets > 0 && (
                    <span className="ml-1 opacity-60">{m.total_sets}s</span>
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
