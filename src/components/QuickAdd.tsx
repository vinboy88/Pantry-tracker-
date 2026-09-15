import { useState } from 'react'
import type { RecentItem } from '../types.ts'

interface QuickAddProps {
  recents: RecentItem[]
  busy: boolean
  onAdd: (name: string) => Promise<void>
  onRecent: (recent: RecentItem) => Promise<void>
  onScan: () => void
}

export function QuickAdd({ recents, busy, onAdd, onRecent, onScan }: QuickAddProps) {
  const [name, setName] = useState('')

  return (
    <section className="quick-add">
      <form
        className="quick-add-row"
        onSubmit={(event) => {
          event.preventDefault()
          const next = name.trim()
          if (!next || busy) return
          void onAdd(next).then(() => setName(''))
        }}
      >
        <label className="quick-add-field">
          <span className="sr-only">Quick add item name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Quick add a name"
            autoComplete="off"
            autoCorrect="on"
            enterKeyHint="done"
            maxLength={80}
            disabled={busy}
          />
        </label>
        <button type="button" className="ghost-btn icon-btn" onClick={onScan} disabled={busy} aria-label="Scan barcode">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="currentColor"
              d="M2 6h2v12H2V6zm4 0h1v12H6V6zm3 0h2v12H9V6zm4 0h1v12h-1V6zm3 0h3v12h-3V6zm5 0h1v12h-1V6z"
            />
          </svg>
        </button>
        <button type="submit" className="quick-add-btn" disabled={busy || !name.trim()}>
          Add
        </button>
      </form>
      {recents.length > 0 ? (
        <div className="chips" aria-label="Add a recent item">
          {recents.map((recent) => (
            <button
              key={recent.name}
              type="button"
              className="chip"
              disabled={busy}
              onClick={() => void onRecent(recent)}
            >
              + {recent.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="quick-add-hint">Uses last unit and category. Matching names add to the count. Scan to skip typing.</p>
      )}
    </section>
  )
}
