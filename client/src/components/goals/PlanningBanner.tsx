import { useGoals } from '../../hooks/useGoals';

/**
 * Nudges goal-setting:
 *  - any day: this week's goals aren't (fully) set yet
 *  - Sunday: next week's goals aren't set yet
 */
export default function PlanningBanner({ onPlan }: { onPlan: (weekOffset: number) => void }) {
  const isSunday = new Date().getDay() === 0;
  const { data: current } = useGoals(0);
  const { data: next } = useGoals(1, { enabled: isSunday });

  if (current && !current.goals_set) {
    return (
      <Banner
        tone="amber"
        icon="🎯"
        text="You haven’t set all of this week’s goals yet."
        action="Set goals"
        onClick={() => onPlan(0)}
      />
    );
  }
  if (isSunday && next && !next.goals_set) {
    return (
      <Banner
        tone="indigo"
        icon="📅"
        text="It’s Sunday — predict next week’s lifts, cardio and golf."
        action="Plan next week"
        onClick={() => onPlan(1)}
      />
    );
  }
  return null;
}

function Banner({ tone, icon, text, action, onClick }: {
  tone: 'amber' | 'indigo'; icon: string; text: string; action: string; onClick: () => void;
}) {
  const cls = tone === 'amber'
    ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'
    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-200';
  const btn = tone === 'amber'
    ? 'bg-amber-500 hover:bg-amber-400'
    : 'bg-indigo-500 hover:bg-indigo-400';
  return (
    <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm ${cls}`}>
      <span className="flex items-center gap-2"><span>{icon}</span>{text}</span>
      <button onClick={onClick} className={`rounded-md px-3 py-1 text-xs font-semibold text-white transition-colors ${btn}`}>
        {action}
      </button>
    </div>
  );
}
