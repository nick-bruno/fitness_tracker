interface Props {
  name: string;
  role: 'primary' | 'secondary';
}

export default function MuscleTagBadge({ name, role }: Props) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        role === 'primary'
          ? 'bg-[var(--accent-light)] text-indigo-700 ring-1 ring-indigo-200/60 dark:text-indigo-300 dark:ring-indigo-700/40'
          : 'bg-[var(--bg-subtle)] text-[var(--text-2)] ring-1 ring-[var(--border)]'
      }`}
    >
      {name}
    </span>
  );
}
