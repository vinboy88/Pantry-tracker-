import type { Category, Unit } from './types.ts'

export const APP_NAME = 'Pantry'
export const DB_NAME = 'pantry-tracker'
export const DB_VERSION = 1
export const STORE_NAME = 'items'
export const THEME_KEY = 'pantry.theme'
export const WELCOME_KEY = 'pantry.welcome.seen'
export const INSTALL_HINT_KEY = 'pantry.installHint.dismissed'
export const SOON_DAYS = 3

export const UNITS: readonly Unit[] = [
  'pcs',
  'oz',
  'lb',
  'g',
  'kg',
  'ml',
  'L',
  'cup',
  'can',
  'box',
  'bag',
  'bottle',
  'jar',
  'pack',
]

export const CATEGORIES: readonly Category[] = [
  'Produce',
  'Dairy',
  'Meat & seafood',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Condiments',
  'Other',
]

export const DEFAULT_UNIT: Unit = 'pcs'
