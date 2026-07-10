import { NavLink } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const sections = [
  {
    label: null,
    links: [{ to: '/dashboard', label: 'Dashboard', icon: '◈' }],
  },
  {
    label: 'Strength',
    links: [
      { to: '/log',             label: 'Log Workout', icon: '＋' },
      { to: '/history',         label: 'History',     icon: '≡' },
      { to: '/exercises',       label: 'Exercises',   icon: '◯' },
      { to: '/recommendations', label: 'AI Coach',    icon: '✦' },
    ],
  },
  {
    label: 'Cardio',
    links: [
      { to: '/log-run', label: 'Log Run',     icon: '→' },
      { to: '/runs',    label: 'Run History', icon: '≡' },
      { to: '/log-row', label: 'Log Row',     icon: '⟶' },
      { to: '/rows',    label: 'Row History', icon: '≡' },
    ],
  },
  {
    label: 'Activities',
    links: [
      { to: '/log-activity', label: 'Log Activity', icon: '🏅' },
      { to: '/activities',   label: 'History',      icon: '≡' },
    ],
  },
  {
    label: 'Integrations',
    links: [
      { to: '/fitbit', label: 'Fitbit Sync', icon: '⌚' },
    ],
  },
];

export default function Sidebar() {
  const { dark, toggle } = useTheme();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-[var(--border)] bg-[var(--bg-card)] px-3 py-5">
      {/* Logo */}
      <div className="mb-7 px-3 pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight text-[var(--text-1)]">Fit</span>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
            Tracker
          </span>
        </div>
        <p className="mt-0.5 text-[11px] font-medium tracking-wide text-[var(--text-3)] uppercase">
          Lift smarter.
        </p>
      </div>

      <nav className="flex flex-col gap-4 flex-1">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--accent-light)] font-semibold text-indigo-600 dark:text-indigo-400'
                        : 'text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`text-base leading-none transition-transform duration-150 group-hover:scale-110 ${
                        isActive ? 'text-indigo-500' : 'text-[var(--text-3)]'
                      }`}>
                        {l.icon}
                      </span>
                      {l.label}
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pt-4 border-t border-[var(--border)]">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] transition-all duration-150"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-base leading-none">{dark ? '☀' : '◐'}</span>
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}
