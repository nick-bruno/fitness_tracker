import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/log', label: 'Log Workout', icon: '✏️' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/exercises', label: 'Exercises', icon: '🏋️' },
  { to: '/recommendations', label: 'AI Coach', icon: '🤖' },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-800 bg-gray-900 px-3 py-6">
      <div className="mb-8 px-3">
        <h1 className="text-lg font-bold text-indigo-400">FitTracker</h1>
        <p className="text-xs text-gray-500">Lift smarter.</p>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-900/60 text-indigo-300 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
