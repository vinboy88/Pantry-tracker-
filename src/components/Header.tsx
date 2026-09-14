import type { ThemeMode } from '../types.ts'

interface HeaderProps {
  themeMode: ThemeMode
  onCycleTheme: () => void
  onOpenSettings: () => void
  onScan: () => void
  total: number
  expiring: number
  empty: number
  low: number
}

const THEME_LABEL: Record<ThemeMode, string> = {
  system: 'Auto',
  light: 'Light',
  dark: 'Dark',
}

export function Header({
  themeMode,
  onCycleTheme,
  onOpenSettings,
  onScan,
  total,
  expiring,
  empty,
  low,
}: HeaderProps) {
  const bits: string[] = []
  if (low) bits.push(`${low} low`)
  if (expiring) bits.push(`${expiring} expiring`)
  if (empty) bits.push(`${empty} out`)

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
              : `${total} item${total === 1 ? '' : 's'}${bits.length ? ` · ${bits.join(' · ')}` : ''}`}
          </p>
        </div>
      </div>
      <div className="topbar-actions">
        <button type="button" className="ghost-btn icon-btn" onClick={onScan} aria-label="Scan barcode">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="currentColor"
              d="M2 6h2v12H2V6zm4 0h1v12H6V6zm3 0h2v12H9V6zm4 0h1v12h-1V6zm3 0h3v12h-3V6zm5 0h1v12h-1V6z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="ghost-btn icon-btn"
          onClick={onOpenSettings}
          aria-label="Settings and backup"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.6.24-1.15.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.48.39 1.03.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.6-.24 1.15-.55 1.63-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="ghost-btn theme-btn"
          onClick={onCycleTheme}
          aria-label={`Theme: ${THEME_LABEL[themeMode]}. Tap to change.`}
        >
          {THEME_LABEL[themeMode]}
        </button>
      </div>
    </header>
  )
}
