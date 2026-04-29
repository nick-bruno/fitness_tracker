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
}

export default function ExerciseSetRow({ set, onChange, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-center text-xs text-gray-500">{set.set_number}</span>
      <input
        type="number"
        min="0"
        placeholder="Reps"
        value={set.reps}
        onChange={(e) => onChange({ ...set, reps: e.target.value })}
        className="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
      />
      <input
        type="number"
        min="0"
        step="0.5"
        placeholder="lb"
        value={set.weight_lb}
        onChange={(e) => onChange({ ...set, weight_lb: e.target.value })}
        className="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
      />
      <input
        type="number"
        min="1"
        max="10"
        step="0.5"
        placeholder="RPE"
        value={set.rpe}
        onChange={(e) => onChange({ ...set, rpe: e.target.value })}
        className="w-16 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
      />
      <button
        onClick={onRemove}
        className="text-gray-600 hover:text-red-400"
        title="Remove set"
      >
        ×
      </button>
    </div>
  );
}
