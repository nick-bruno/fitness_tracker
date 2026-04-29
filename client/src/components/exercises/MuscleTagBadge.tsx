interface Props {
  name: string;
  role: 'primary' | 'secondary';
}

export default function MuscleTagBadge({ name, role }: Props) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
        role === 'primary'
          ? 'bg-indigo-900/70 text-indigo-300'
          : 'bg-gray-800 text-gray-400'
      }`}
    >
      {name}
    </span>
  );
}
