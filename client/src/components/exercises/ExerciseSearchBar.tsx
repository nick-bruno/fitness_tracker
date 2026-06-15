import { useEffect, useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function ExerciseSearchBar({ value, onChange }: Props) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(t);
  }, [local, onChange]);

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder="Search exercises..."
      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] focus:border-indigo-400 focus:outline-none transition-colors"
    />
  );
}
