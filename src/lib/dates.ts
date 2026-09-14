import { SOON_DAYS } from '../constants.ts'
import { isLowStock } from './stock.ts'
import type { ItemTone, PantryItem } from '../types.ts'

export function todayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysIso(days: number, from = todayIso()): string {
  const [year, month, day] = from.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysUntil(isoDate: string, from = todayIso()): number {
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = isoDate.split('-').map(Number)
  const start = Date.UTC(y1, m1 - 1, d1)
  const end = Date.UTC(y2, m2 - 1, d2)
  return Math.round((end - start) / 86_400_000)
}

export function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function expiryLabel(isoDate: string | null): string | null {
  if (!isoDate) return null
  const delta = daysUntil(isoDate)
  if (delta < 0) {
    if (delta === -1) return 'Expired yesterday'
    return `Expired ${formatDay(isoDate)}`
  }
  if (delta === 0) return 'Expires today'
  if (delta === 1) return 'Expires tomorrow'
  if (delta <= 7) return `Expires in ${delta} days`
  return `Expires ${formatDay(isoDate)}`
}

export function itemTone(item: PantryItem): ItemTone {
  if (item.quantity <= 0) return 'empty'
  if (item.expiryDate) {
    const delta = daysUntil(item.expiryDate)
    if (delta < 0) return 'expired'
    if (delta <= SOON_DAYS) return 'soon'
  }
  if (isLowStock(item)) return 'low'
  return 'ok'
}

export function isExpiringConcern(item: PantryItem): boolean {
  const tone = itemTone(item)
  return tone === 'expired' || tone === 'soon'
}
