interface SetRowState {
  set_number: number;
  reps: string;
  weight_lb: string;
  rpe: string;
}

interface Props {
  set: SetRowState;
  onChange: (updated: SetRowState) => void;
  onRemove: () => void;
  isLast?: boolean;
  onAddSet?: () => void;
}

const inputCls = 'rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-2 py-1.5 text-sm text-stone-900 focus:border-indigo-400 focus:outline-none focus:bg-white transition-colors';

export default function ExerciseSetRow({ set, onChange, onRemove, isLast, onAddSet }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-center text-xs font-medium text-stone-400">{set.set_number}</span>
      <input
        type="number" min="0" placeholder="—"
        value={set.reps}
        onChange={(e) => onChange({ ...set, reps: e.target.value })}
        className={`w-20 ${inputCls}`}
      />
      <input
        type="number" min="0" step="0.5" placeholder="—"
        value={set.weight_lb}
        onChange={(e) => onChange({ ...set, weight_lb: e.target.value })}
        className={`w-20 ${inputCls}`}
      />
      <input
        type="number" min="1" max="10" step="0.5" placeholder="—"
        value={set.rpe}
        onChange={(e) => onChange({ ...set, rpe: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Tab' && isLast && onAddSet) {
            e.preventDefault();
            onAddSet();
          }
        }}
        className={`w-16 ${inputCls}`}
      />
      <button onClick={onRemove} className="rounded p-0.5 text-stone-300 hover:text-red-500 transition-colors" title="Remove set">
        ×
      </button>
    </div>
  );
}
