const ALL_GOALS = ['Strength', 'Muscle Balance', 'Hypertrophy', 'General Fitness'];

interface Props {
  selected: string[];
  onChange: (goals: string[]) => void;
}

export default function GoalSelector({ selected, onChange }: Props) {
  const toggle = (goal: string) => {
    onChange(
      selected.includes(goal)
        ? selected.filter((g) => g !== goal)
        : [...selected, goal],
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_GOALS.map((goal) => (
        <button
          key={goal}
          onClick={() => toggle(goal)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selected.includes(goal)
              ? 'bg-indigo-600 text-white'
              : 'border border-gray-700 bg-gray-800 text-gray-400 hover:border-indigo-600 hover:text-gray-200'
          }`}
        >
          {goal}
        </button>
      ))}
    </div>
  );
}
