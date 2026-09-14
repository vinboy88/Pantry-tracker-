export type Unit =
  | 'pcs'
  | 'oz'
  | 'lb'
  | 'g'
  | 'kg'
  | 'ml'
  | 'L'
  | 'cup'
  | 'can'
  | 'box'
  | 'bag'
  | 'bottle'
  | 'jar'
  | 'pack'

export type Category =
  | 'Produce'
  | 'Dairy'
  | 'Meat & seafood'
  | 'Pantry'
  | 'Frozen'
  | 'Beverages'
  | 'Snacks'
  | 'Condiments'
  | 'Other'

export type SortMode = 'name' | 'expiry' | 'updated'
export type StockFilter = 'all' | 'expiring' | 'empty'
export type ThemeMode = 'system' | 'light' | 'dark'

export interface PantryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  expiryDate: string | null
  notes: string
  createdAt: number
  updatedAt: number
}

export interface ItemDraft {
  name: string
  quantity: number
  unit: string
  category: string
  expiryDate: string
  notes: string
}

export type ExpiryTone = 'ok' | 'soon' | 'expired' | 'empty'
