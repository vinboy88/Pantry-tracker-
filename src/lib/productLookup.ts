import { CATEGORIES } from '../constants.ts'
import { normalizeBarcode } from './barcode.ts'
import type { Category } from '../types.ts'

export interface ProductLookup {
  name: string
  category: string
}

const OFF_FIELDS = 'product_name,product_name_en,generic_name,brands,categories_tags'
const LOOKUP_MS = 4500

const CATEGORY_HINTS: { tag: string; category: Category }[] = [
  { tag: 'en:milks', category: 'Dairy' },
  { tag: 'en:cheeses', category: 'Dairy' },
  { tag: 'en:yogurts', category: 'Dairy' },
  { tag: 'en:dairies', category: 'Dairy' },
  { tag: 'en:eggs', category: 'Dairy' },
  { tag: 'en:meats', category: 'Meat & seafood' },
  { tag: 'en:seafood', category: 'Meat & seafood' },
  { tag: 'en:fishes', category: 'Meat & seafood' },
  { tag: 'en:breads', category: 'Bread' },
  { tag: 'en:frozen-foods', category: 'Frozen' },
  { tag: 'en:canned-foods', category: 'Canned' },
  { tag: 'en:beverages', category: 'Beverages' },
  { tag: 'en:snacks', category: 'Snacks' },
  { tag: 'en:breakfasts', category: 'Breakfast' },
  { tag: 'en:condiments', category: 'Condiments' },
  { tag: 'en:sauces', category: 'Condiments' },
  { tag: 'en:spices', category: 'Spices' },
  { tag: 'en:groceries', category: 'Pantry' },
  { tag: 'en:plant-based-foods-and-beverages', category: 'Produce' },
  { tag: 'en:fruits', category: 'Produce' },
  { tag: 'en:vegetables', category: 'Produce' },
]

function firstName(product: Record<string, unknown>): string {
  const keys = ['product_name_en', 'product_name', 'generic_name'] as const
  for (const key of keys) {
    const value = product[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function mapCategory(tags: unknown): string {
  if (!Array.isArray(tags)) return ''
  const list = tags.filter((tag): tag is string => typeof tag === 'string')
  for (const hint of CATEGORY_HINTS) {
    if (list.includes(hint.tag)) return hint.category
  }
  return ''
}

function clipName(name: string): string {
  const compact = name.replace(/\s+/g, ' ').trim()
  if (compact.length <= 80) return compact
  return compact.slice(0, 80).trim()
}

/**
 * Best-effort public UPC/EAN name lookup. Fails open: network, CORS, or
 * unknown codes just return null so Kelvin can type the name.
 */
export async function lookupProduct(barcode: string): Promise<ProductLookup | null> {
  const code = normalizeBarcode(barcode)
  if (!code || !/^\d{8,14}$/.test(code)) return null

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), LOOKUP_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const body = (await response.json()) as {
      status?: number
      product?: Record<string, unknown>
    }
    if (body.status !== 1 || !body.product) return null
    const name = clipName(firstName(body.product))
    if (!name) return null
    const category = mapCategory(body.product.categories_tags)
    const allowed = CATEGORIES.includes(category as Category) ? category : ''
    return { name, category: allowed }
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
