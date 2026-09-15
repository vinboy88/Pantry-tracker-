import { barcodeSearchHaystack } from './barcode.ts'
import { isExpiringConcern } from './dates.ts'
import { isLowStock } from './stock.ts'
import type { PantryItem, SortMode, StockFilter } from '../types.ts'

export function uniqueCategories(items: PantryItem[], defaults: readonly string[]): string[] {
  const used = new Set(
    items.map((item) => item.category.trim()).filter((category) => category.length > 0),
  )
  const extras = Array.from(used)
    .filter((category) => !defaults.includes(category))
    .sort((a, b) => a.localeCompare(b))
  const usedStarters = defaults.filter((category) => used.has(category))
  const unusedStarters = defaults.filter((category) => !used.has(category))
  return [...usedStarters, ...unusedStarters, ...extras]
}

export function filterAndSort(
  items: PantryItem[],
  query: string,
  category: string,
  stock: StockFilter,
  sort: SortMode,
): PantryItem[] {
  const needle = query.trim().toLowerCase()
  const barcodeNeedle = needle.replace(/[\s-]/g, '')

  const filtered = items.filter((item) => {
    if (
      needle &&
      !item.name.toLowerCase().includes(needle) &&
      !item.brand.toLowerCase().includes(needle) &&
      !barcodeSearchHaystack(item.barcode).includes(barcodeNeedle)
    ) {
      return false
    }
    if (category !== 'all' && item.category !== category) return false
    if (stock === 'empty' && item.quantity > 0) return false
    if (stock === 'expiring' && !isExpiringConcern(item)) return false
    if (stock === 'low' && !isLowStock(item)) return false
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

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

const MAX_BRAND = 60

/** Trim, collapse spaces, and clip. Empty string when unset. */
export function normalizeBrand(brand: string): string {
  const compact = brand.trim().replace(/\s+/g, ' ')
  if (compact.length <= MAX_BRAND) return compact
  return compact.slice(0, MAX_BRAND).trim()
}

export function uniqueBrands(items: readonly PantryItem[]): string[] {
  const seen = new Set<string>()
  const brands: string[] = []
  for (const item of items) {
    const brand = normalizeBrand(item.brand)
    if (!brand) continue
    const key = brand.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    brands.push(brand)
  }
  brands.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  return brands
}

/**
 * Match by name. When `brand` is set, prefer the same brand, then an unbranded
 * name twin (so restock can fill brand). Different brands stay separate items.
 */
export function findNameMatch(
  items: PantryItem[],
  name: string,
  brand?: string,
): PantryItem | undefined {
  const needle = normalizeName(name)
  if (!needle) return undefined
  const nameMatches = items.filter((item) => normalizeName(item.name) === needle)
  const brandNeedle = normalizeName(brand ?? '')

  if (brandNeedle) {
    const branded = nameMatches.filter((item) => normalizeName(item.brand) === brandNeedle)
    branded.sort((a, b) => b.updatedAt - a.updatedAt)
    if (branded[0]) return branded[0]
    const unbranded = nameMatches.filter((item) => !normalizeName(item.brand))
    unbranded.sort((a, b) => b.updatedAt - a.updatedAt)
    return unbranded[0]
  }

  nameMatches.sort((a, b) => b.updatedAt - a.updatedAt)
  return nameMatches[0]
}
