import { DEFAULT_LOW_STOCK_THRESHOLD } from '../constants.ts'
import type { PantryItem } from '../types.ts'

export function effectiveThreshold(item: Pick<PantryItem, 'lowStockThreshold'>): number {
  if (item.lowStockThreshold == null) return DEFAULT_LOW_STOCK_THRESHOLD
  if (!Number.isFinite(item.lowStockThreshold)) return DEFAULT_LOW_STOCK_THRESHOLD
  return Math.max(0, item.lowStockThreshold)
}

/** True when quantity is above 0 and at or below the item’s threshold (default 1). Threshold 0 never flags low. */
export function isLowStock(item: Pick<PantryItem, 'quantity' | 'lowStockThreshold'>): boolean {
  const threshold = effectiveThreshold(item)
  if (threshold <= 0) return false
  return item.quantity > 0 && item.quantity <= threshold
}

export function lowStockItems<T extends Pick<PantryItem, 'quantity' | 'lowStockThreshold'>>(
  items: T[],
): T[] {
  return items.filter(isLowStock)
}

export function lowStockKey(items: PantryItem[]): string {
  return lowStockItems(items)
    .map((item) => item.id)
    .sort()
    .join(',')
}

export function parseThreshold(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.round(n * 100) / 100)
}

export function formatLowNames(items: PantryItem[]): string {
  const names = items.map((item) => item.name)
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]}`
  return `${names[0]}, ${names[1]}, and ${names.length - 2} more`
}
