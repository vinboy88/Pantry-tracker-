import { isExpiringConcern } from './dates.ts'
import type { PantryItem, SortMode, StockFilter } from '../types.ts'

export function uniqueCategories(items: PantryItem[], defaults: readonly string[]): string[] {
  const extras = items
    .map((item) => item.category.trim())
    .filter((category) => category && !defaults.includes(category))
  return [...defaults, ...Array.from(new Set(extras)).sort((a, b) => a.localeCompare(b))]
}

export function filterAndSort(
  items: PantryItem[],
  query: string,
  category: string,
  stock: StockFilter,
  sort: SortMode,
): PantryItem[] {
  const needle = query.trim().toLowerCase()

  const filtered = items.filter((item) => {
    if (needle && !item.name.toLowerCase().includes(needle)) return false
    if (category !== 'all' && item.category !== category) return false
    if (stock === 'empty' && item.quantity > 0) return false
    if (stock === 'expiring' && !isExpiringConcern(item)) return false
    return true
  })

  const ranked = [...filtered]
  ranked.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    if (sort === 'updated') return b.updatedAt - a.updatedAt
    const aExpiry = a.expiryDate ?? '9999-12-31'
    const bExpiry = b.expiryDate ?? '9999-12-31'
    if (aExpiry !== bExpiry) return aExpiry.localeCompare(bExpiry)
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
  return ranked
}

export function formatQuantity(quantity: number): string {
  if (Number.isInteger(quantity)) return String(quantity)
  return String(Math.round(quantity * 100) / 100)
}

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value * 100) / 100)
}
