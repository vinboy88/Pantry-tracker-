interface EmptyStateProps {
  filtered: boolean
  onAdd: () => void
  onSample: () => void
}

export function EmptyState({ filtered, onAdd, onSample }: EmptyStateProps) {
  if (filtered) {
    return (
      <section className="empty">
        <div className="empty-art" aria-hidden="true" />
        <h2>Nothing matches</h2>
        <p>Try another name, category, or clear the filters.</p>
      </section>
    )
  }

  return (
    <section className="empty">
      <div className="empty-art" aria-hidden="true" />
      <h2>Your pantry is empty</h2>
      <p>Add what you have on hand. Quantities, expiry dates, and notes stay on this device.</p>
      <div className="empty-actions">
        <button type="button" className="primary-btn" onClick={onAdd}>
          Add first item
        </button>
        <button type="button" className="ghost-btn" onClick={onSample}>
          Load a sample pantry
        </button>
      </div>
    </section>
  )
}
