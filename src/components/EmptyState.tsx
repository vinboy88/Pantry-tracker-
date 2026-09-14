import { JarMark } from './JarMark.tsx'

interface EmptyStateProps {
  filtered: boolean
  onAdd: () => void
  onScan: () => void
  onSample: () => void
  onClearFilters: () => void
}

export function EmptyState({ filtered, onAdd, onScan, onSample, onClearFilters }: EmptyStateProps) {
  if (filtered) {
    return (
      <section className="empty">
        <div className="empty-art" aria-hidden="true">
          <JarMark size={72} />
        </div>
        <h2>Nothing matches</h2>
        <p>Try another name, category, or clear the filters.</p>
        <div className="empty-actions">
          <button type="button" className="primary-btn" onClick={onClearFilters}>
            Clear filters
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="empty">
      <div className="empty-art" aria-hidden="true">
        <JarMark size={72} />
      </div>
      <h2>Your pantry is empty</h2>
      <p>Add what you have on hand, or scan a package barcode. Quantities, expiry dates, and notes stay on this device.</p>
      <div className="empty-actions">
        <button type="button" className="primary-btn" onClick={onAdd}>
          Add first item
        </button>
        <button type="button" className="ghost-btn" onClick={onScan}>
          Scan a barcode
        </button>
        <button type="button" className="ghost-btn" onClick={onSample}>
          Load a sample pantry
        </button>
      </div>
    </section>
  )
}
