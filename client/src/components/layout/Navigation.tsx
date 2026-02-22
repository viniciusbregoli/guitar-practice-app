import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/practice', label: 'Practice', icon: PlayIcon },
  { to: '/songs', label: 'Songs', icon: MusicIcon },
  { to: '/progress', label: 'Progress', icon: ChartIcon },
  { to: '/metronome', label: 'Metronome', icon: MetronomeIcon },
];

export function Navigation() {
  return (
    <>
      {/* Desktop sidebar — part of flex row, sticky */}
      <nav className="hidden md:flex w-20 shrink-0 flex-col items-center gap-1 pt-6 pb-4 bg-surface border-r border-border sticky top-0 self-start h-screen">
        <div className="mb-6 text-amber-500 font-display text-xl">G</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex flex-col items-center justify-center w-11 h-11 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-raised'
              }`
            }
          >
            <item.icon />
            <span className="text-[9px] mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-surface/95 backdrop-blur-lg border-t border-border px-2 pb-[env(safe-area-inset-bottom)] z-50 h-16">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all min-w-[48px] ${
                isActive
                  ? 'text-amber-400'
                  : 'text-text-muted'
              }`
            }
          >
            <item.icon />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function HomeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function MetronomeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L8 22h8L12 2z" />
      <path d="M12 8l5-3" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}
