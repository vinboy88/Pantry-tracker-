import type { ThemeMode } from '../types.ts'

interface HeaderProps {
  themeMode: ThemeMode
  onCycleTheme: () => void
  total: number
  expiring: number
  empty: number
}

const THEME_LABEL: Record<ThemeMode, string> = {
  system: 'Auto',
  light: 'Light',
  dark: 'Dark',
}

export function Header({ themeMode, onCycleTheme, total, expiring, empty }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <rect width="32" height="32" rx="8" fill="currentColor" />
            <path
              d="M12 6.5h8a2 2 0 0 1 2 2v1.2H10V8.5a2 2 0 0 1 2-2Zm-1.2 5h10.4c.9 0 1.6.7 1.6 1.6v11.2a3.2 3.2 0 0 1-3.2 3.2h-7.2a3.2 3.2 0 0 1-3.2-3.2V13.1c0-.9.7-1.6 1.6-1.6Z"
              fill="var(--on-sage)"
            />
            <rect x="11.2" y="15.2" width="9.6" height="5.2" rx="1.4" fill="currentColor" />
          </svg>
        </span>
        <div>
          <h1>Pantry</h1>
          <p className="brand-meta">
            {total === 0
              ? 'Nothing on the shelf yet'
              : `${total} item${total === 1 ? '' : 's'}${
                  expiring ? ` · ${expiring} expiring` : ''
                }${empty ? ` · ${empty} out` : ''}`}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="ghost-btn theme-btn"
        onClick={onCycleTheme}
        aria-label={`Theme: ${THEME_LABEL[themeMode]}. Tap to change.`}
      >
        {THEME_LABEL[themeMode]}
      </button>
    </header>
  )
}
