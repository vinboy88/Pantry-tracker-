import { useId } from 'react'
import { formatLowNames } from '../lib/stock.ts'
import type { PantryItem } from '../types.ts'

interface LowStockBannerProps {
  items: PantryItem[]
  onShow: () => void
  onDismiss: () => void
}

export function LowStockBanner({ items, onShow, onDismiss }: LowStockBannerProps) {
  const titleId = useId()
  if (items.length === 0) return null

  const headline = items.length === 1 ? '1 item is running low' : `${items.length} items are running low`

  return (
    <aside className="alert-banner" role="status" aria-labelledby={titleId}>
      <div>
        <strong id={titleId}>{headline}</strong>
        <p>{formatLowNames(items)}</p>
      </div>
      <div className="alert-banner-actions">
        <button type="button" className="text-btn" onClick={onShow}>
          Show
        </button>
        <button type="button" className="ghost-btn" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </aside>
  )
}
