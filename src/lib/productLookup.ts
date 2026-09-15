import { CATEGORIES, DEFAULT_UNIT, UNITS } from '../constants.ts'
import { barcodeLookupCandidates } from './barcode.ts'
import type { Category, ItemDraft, Unit } from '../types.ts'

export type LookupSource =
  | 'openfoodfacts'
  | 'openproductsfacts'
  | 'openbeautyfacts'
  | 'openpetfoodfacts'

export interface ProductLookup {
  name: string
  brand: string
  category: string
  unit: string
  packageSize: string
  source: LookupSource
}

export type LookupOutcome =
  | { status: 'found'; product: ProductLookup }
  | { status: 'miss' }
  | { status: 'error'; reason: 'timeout' | 'network' }

const OFF_FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'generic_name',
  'generic_name_en',
  'abbreviated_product_name',
  'brands',
  'brand_owner',
  'categories_tags',
  'categories',
  'pnns_groups_1',
  'quantity',
  'product_quantity',
  'product_quantity_unit',
].join(',')

const LOOKUP_MS = 12000

const OFF_PRODUCT = 'https://world.openfoodfacts.org/api/v2/product'
const OFF_SEARCH = 'https://world.openfoodfacts.org/api/v2/search'
const SISTER_HOSTS: { url: string; source: LookupSource }[] = [
  { url: 'https://world.openproductsfacts.org/api/v2/product', source: 'openproductsfacts' },
  { url: 'https://world.openbeautyfacts.org/api/v2/product', source: 'openbeautyfacts' },
  { url: 'https://world.openpetfoodfacts.org/api/v2/product', source: 'openpetfoodfacts' },
]

/** More specific tags first. Substring match on OFF `categories_tags`. */
const CATEGORY_HINTS: { needle: string; category: Category }[] = [
  { needle: 'en:yogurts', category: 'Dairy' },
  { needle: 'en:yogurt', category: 'Dairy' },
  { needle: 'en:cheeses', category: 'Dairy' },
  { needle: 'en:cheese', category: 'Dairy' },
  { needle: 'en:butters', category: 'Dairy' },
  { needle: 'en:milks', category: 'Dairy' },
  { needle: 'en:milk', category: 'Dairy' },
  { needle: 'en:cream', category: 'Dairy' },
  { needle: 'en:eggs', category: 'Dairy' },
  { needle: 'en:dairies', category: 'Dairy' },
  { needle: 'en:ice-creams', category: 'Frozen' },
  { needle: 'en:frozen-foods', category: 'Frozen' },
  { needle: 'en:frozen', category: 'Frozen' },
  { needle: 'en:meats', category: 'Meat & seafood' },
  { needle: 'en:meat', category: 'Meat & seafood' },
  { needle: 'en:poultry', category: 'Meat & seafood' },
  { needle: 'en:seafood', category: 'Meat & seafood' },
  { needle: 'en:fishes', category: 'Meat & seafood' },
  { needle: 'en:fish', category: 'Meat & seafood' },
  { needle: 'en:breakfast-cereals', category: 'Breakfast' },
  { needle: 'en:breakfasts', category: 'Breakfast' },
  { needle: 'en:breads', category: 'Bread' },
  { needle: 'en:bread', category: 'Bread' },
  { needle: 'en:canned-foods', category: 'Canned' },
  { needle: 'en:canned-', category: 'Canned' },
  { needle: 'en:waters', category: 'Beverages' },
  { needle: 'en:sodas', category: 'Beverages' },
  { needle: 'en:soft-drinks', category: 'Beverages' },
  { needle: 'en:juices', category: 'Beverages' },
  { needle: 'en:teas', category: 'Beverages' },
  { needle: 'en:coffees', category: 'Beverages' },
  { needle: 'en:beverages', category: 'Beverages' },
  { needle: 'en:chocolates', category: 'Snacks' },
  { needle: 'en:chips', category: 'Snacks' },
  { needle: 'en:crisps', category: 'Snacks' },
  { needle: 'en:biscuits', category: 'Snacks' },
  { needle: 'en:cookies', category: 'Snacks' },
  { needle: 'en:snacks', category: 'Snacks' },
  { needle: 'en:condiments', category: 'Condiments' },
  { needle: 'en:sauces', category: 'Condiments' },
  { needle: 'en:mustards', category: 'Condiments' },
  { needle: 'en:ketchups', category: 'Condiments' },
  { needle: 'en:spices', category: 'Spices' },
  { needle: 'en:herbs', category: 'Spices' },
  { needle: 'en:fruits', category: 'Produce' },
  { needle: 'en:vegetables', category: 'Produce' },
  { needle: 'en:fresh-vegetables', category: 'Produce' },
  { needle: 'en:fresh-fruits', category: 'Produce' },
  { needle: 'en:pasta', category: 'Pantry' },
  { needle: 'en:rices', category: 'Pantry' },
  { needle: 'en:rice', category: 'Pantry' },
  { needle: 'en:oils', category: 'Pantry' },
  { needle: 'en:flours', category: 'Pantry' },
  { needle: 'en:sugars', category: 'Pantry' },
  { needle: 'en:nuts', category: 'Pantry' },
  { needle: 'en:legumes', category: 'Pantry' },
  { needle: 'en:spreads', category: 'Pantry' },
  { needle: 'en:groceries', category: 'Pantry' },
]

const PNNS_HINTS: { needle: string; category: Category }[] = [
  { needle: 'milk and dairy', category: 'Dairy' },
  { needle: 'fish', category: 'Meat & seafood' },
  { needle: 'meat', category: 'Meat & seafood' },
  { needle: 'cereal', category: 'Breakfast' },
  { needle: 'bread', category: 'Bread' },
  { needle: 'beverage', category: 'Beverages' },
  { needle: 'sweet', category: 'Snacks' },
  { needle: 'salty snack', category: 'Snacks' },
  { needle: 'fruit', category: 'Produce' },
  { needle: 'vegetable', category: 'Produce' },
  { needle: 'fat', category: 'Pantry' },
]

const UNIT_ALIASES: { needle: string; unit: Unit }[] = [
  { needle: 'bottle', unit: 'bottle' },
  { needle: 'bottles', unit: 'bottle' },
  { needle: 'jar', unit: 'jar' },
  { needle: 'jars', unit: 'jar' },
  { needle: 'can', unit: 'can' },
  { needle: 'cans', unit: 'can' },
  { needle: 'box', unit: 'box' },
  { needle: 'boxes', unit: 'box' },
  { needle: 'bag', unit: 'bag' },
  { needle: 'bags', unit: 'bag' },
  { needle: 'pack', unit: 'pack' },
  { needle: 'packs', unit: 'pack' },
  { needle: 'pkt', unit: 'pack' },
]

const NAME_KEYS = [
  'product_name_en',
  'product_name',
  'generic_name_en',
  'generic_name',
  'abbreviated_product_name',
] as const

function clip(value: string, max = 80): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= max) return compact
  return compact.slice(0, max).trim()
}

function readString(product: Record<string, unknown>, key: string): string {
  const value = product[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function primaryBrand(raw: string): string {
  const first = raw.split(',')[0]?.trim() ?? ''
  return clip(first, 40)
}

export function composeDisplayName(name: string, brand: string): string {
  const product = clip(name)
  const label = clip(brand, 40)
  if (!product) return label
  if (!label) return product
  const productLc = product.toLowerCase()
  const brandLc = label.toLowerCase()
  if (productLc.includes(brandLc) || brandLc.includes(productLc)) {
    return product.length >= label.length ? product : label
  }
  return clip(`${label} ${product}`)
}

function firstName(product: Record<string, unknown>): string {
  for (const key of NAME_KEYS) {
    const value = readString(product, key)
    if (value) return value
  }
  return ''
}

function tagMatches(tag: string, needle: string): boolean {
  return tag === needle || tag.startsWith(`${needle}-`) || tag.includes(needle)
}

export function mapCategory(tags: unknown, categoriesText = '', pnns = ''): string {
  const list = Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.toLowerCase())
    : []
  for (const hint of CATEGORY_HINTS) {
    if (list.some((tag) => tagMatches(tag, hint.needle))) return hint.category
  }

  const blob = `${categoriesText} ${pnns}`.toLowerCase()
  if (blob.trim()) {
    for (const hint of CATEGORY_HINTS) {
      const label = hint.needle.replace(/^en:/, '').replace(/-/g, ' ')
      if (label.length >= 4 && blob.includes(label)) return hint.category
    }
    for (const hint of PNNS_HINTS) {
      if (blob.includes(hint.needle)) return hint.category
    }
  }

  return ''
}

export function mapUnit(quantityText: string, quantityUnit: string): string {
  const direct = quantityUnit.trim().toLowerCase()
  if (direct) {
    const hit = UNIT_ALIASES.find((alias) => alias.needle === direct)
    if (hit && UNITS.includes(hit.unit)) return hit.unit
  }
  const text = quantityText.toLowerCase()
  for (const alias of UNIT_ALIASES) {
    const pattern = new RegExp(`(^|[^a-z])${alias.needle}([^a-z]|$)`)
    if (pattern.test(text) && UNITS.includes(alias.unit)) return alias.unit
  }
  return ''
}

function packageSize(product: Record<string, unknown>): string {
  const raw = readString(product, 'quantity')
  if (!raw) return ''
  return clip(raw.replace(/\s+e\b/gi, ''), 40)
}

function productFound(body: Record<string, unknown>): boolean {
  const status = body.status
  if (status === 0 || status === '0' || status === 'failure') return false
  if (status === 1 || status === '1' || status === 'success') return true
  return Boolean(body.product && typeof body.product === 'object')
}

export function productFromOff(
  product: Record<string, unknown>,
  source: LookupSource = 'openfoodfacts',
): ProductLookup | null {
  const brand = primaryBrand(readString(product, 'brands') || readString(product, 'brand_owner'))
  const name = composeDisplayName(firstName(product), brand)
  if (!name) return null
  const category = mapCategory(
    product.categories_tags,
    readString(product, 'categories'),
    readString(product, 'pnns_groups_1'),
  )
  const allowed = CATEGORIES.includes(category as Category) ? category : ''
  const quantityText = readString(product, 'quantity')
  const quantityUnit =
    typeof product.product_quantity_unit === 'string' ? product.product_quantity_unit : ''
  const unit = mapUnit(quantityText, quantityUnit)
  return {
    name,
    brand,
    category: allowed,
    unit,
    packageSize: packageSize(product),
    source,
  }
}

function parseProductBody(body: unknown, source: LookupSource): ProductLookup | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  if (!productFound(record)) return null
  const product = record.product
  if (!product || typeof product !== 'object') return null
  return productFromOff(product as Record<string, unknown>, source)
}

function parseSearchBody(body: unknown, preferred: readonly string[]): ProductLookup | null {
  if (!body || typeof body !== 'object') return null
  const products = (body as { products?: unknown }).products
  if (!Array.isArray(products)) return null
  const rows = products.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
  rows.sort((a, b) => {
    const ac = typeof a.code === 'string' ? a.code : ''
    const bc = typeof b.code === 'string' ? b.code : ''
    const ai = preferred.indexOf(ac)
    const bi = preferred.indexOf(bc)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  for (const row of rows) {
    const found = productFromOff(row, 'openfoodfacts')
    if (found) return found
  }
  return null
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown | null> {
  try {
    const response = await fetch(url, { signal })
    try {
      return await response.json()
    } catch {
      return null
    }
  } catch (error) {
    if (signal.aborted) throw error
    return null
  }
}

function offProductUrl(code: string): string {
  const params = new URLSearchParams({
    fields: OFF_FIELDS,
    lc: 'en',
    cc: 'au',
    product_type: 'all',
  })
  return `${OFF_PRODUCT}/${encodeURIComponent(code)}.json?${params}`
}

function offSearchUrl(codes: readonly string[]): string {
  const params = new URLSearchParams({
    code: codes.join(','),
    fields: OFF_FIELDS,
    page_size: '5',
    lc: 'en',
    cc: 'au',
  })
  return `${OFF_SEARCH}?${params}`
}

function sisterUrl(host: string, code: string): string {
  const params = new URLSearchParams({ fields: OFF_FIELDS, lc: 'en' })
  return `${host}/${encodeURIComponent(code)}.json?${params}`
}

/** Fill only empty draft fields so a typed name/category is never overwritten. */
export function applyLookupToDraft(draft: ItemDraft, found: ProductLookup): ItemDraft {
  return {
    ...draft,
    name: draft.name.trim() ? draft.name : found.name,
    category: draft.category.trim() ? draft.category : found.category,
    unit: draft.unit && draft.unit !== DEFAULT_UNIT ? draft.unit : found.unit || draft.unit,
    notes: draft.notes.trim() ? draft.notes : found.packageSize,
  }
}

export function lookupSourceLabel(source: LookupSource): string {
  if (source === 'openproductsfacts') return 'Open Products Facts'
  if (source === 'openbeautyfacts') return 'Open Beauty Facts'
  if (source === 'openpetfoodfacts') return 'Open Pet Food Facts'
  return 'Open Food Facts'
}

/**
 * Best-effort public barcode lookup. No API key.
 *
 * 1. Open Food Facts product API (AU/English, all product types)
 * 2. OFF search with raw + normalized codes (UPC-A / EAN-13 / GTIN-14)
 * 3. Open Products / Beauty / Pet Food Facts for household items
 *
 * OFF is free; they ask clients not to burst more than ~10 requests/s.
 * Unknown or private-label AU groceries often have no catalog row —
 * keep the barcode and type the rest.
 */
export async function lookupProduct(barcode: string): Promise<LookupOutcome> {
  const candidates = barcodeLookupCandidates(barcode)
  if (candidates.length === 0) return { status: 'miss' }

  const controller = new AbortController()
  const timer = globalThis.setTimeout(() => controller.abort(), LOOKUP_MS)

  try {
    const exact = parseProductBody(
      await fetchJson(offProductUrl(candidates[0]), controller.signal),
      'openfoodfacts',
    )
    if (exact) return { status: 'found', product: exact }

    const searched = parseSearchBody(
      await fetchJson(offSearchUrl(candidates), controller.signal),
      candidates,
    )
    if (searched) return { status: 'found', product: searched }

    for (const sister of SISTER_HOSTS) {
      const found = parseProductBody(
        await fetchJson(sisterUrl(sister.url, candidates[0]), controller.signal),
        sister.source,
      )
      if (found) return { status: 'found', product: found }
    }

    return { status: 'miss' }
  } catch (error) {
    if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return { status: 'error', reason: 'timeout' }
    }
    return { status: 'error', reason: 'network' }
  } finally {
    globalThis.clearTimeout(timer)
  }
}
