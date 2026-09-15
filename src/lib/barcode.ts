import type { PantryItem } from '../types.ts'

const DIGITS = /^\d+$/

/** Strip spaces/dashes; lift UPC-A (12 digits) to EAN-13 with a leading 0. */
export function normalizeBarcode(raw: string): string {
  const trimmed = raw.trim().replace(/[\s-]/g, '')
  if (!trimmed) return ''
  if (DIGITS.test(trimmed) && trimmed.length === 12) return `0${trimmed}`
  return trimmed
}

function upcACheckDigit(body11: string): string {
  let sum = 0
  for (let i = 0; i < 11; i += 1) {
    const digit = Number(body11[i])
    sum += i % 2 === 0 ? digit * 3 : digit
  }
  return String((10 - (sum % 10)) % 10)
}

/**
 * Expand a UPC-E (6–8 digits) to UPC-A. Returns null when the input is not
 * a plausible UPC-E (EAN-8 grocery codes are left alone by the caller).
 */
export function expandUpcE(raw: string): string | null {
  const digits = raw.trim().replace(/[\s-]/g, '')
  if (!DIGITS.test(digits) || digits.length < 6 || digits.length > 8) return null

  let ns = '0'
  let core = ''
  if (digits.length === 6) {
    core = digits
  } else if (digits.length === 7) {
    if (digits[0] === '0' || digits[0] === '1') {
      ns = digits[0]
      core = digits.slice(1)
    } else {
      core = digits.slice(0, 6)
    }
  } else if (digits[0] === '0' || digits[0] === '1') {
    ns = digits[0]
    core = digits.slice(1, 7)
  } else {
    return null
  }

  if (core.length !== 6) return null
  const last = core[5]
  let middle: string
  if (last === '0' || last === '1' || last === '2') {
    middle = `${core.slice(0, 2)}${last}0000${core.slice(2, 5)}`
  } else if (last === '3') {
    middle = `${core.slice(0, 3)}00000${core.slice(3, 5)}`
  } else if (last === '4') {
    middle = `${core.slice(0, 4)}00000${core[4]}`
  } else {
    middle = `${core.slice(0, 5)}0000${last}`
  }

  const body11 = `${ns}${middle}`
  if (body11.length !== 11 || !DIGITS.test(body11)) return null
  const upcA = `${body11}${upcACheckDigit(body11)}`
  if (digits.length === 8 && digits[7] !== upcA[11]) return null
  return upcA
}

/**
 * Codes to try against a catalog. Keep leading zeros (GTIN is a string).
 * Covers UPC-A ↔ EAN-13, GTIN-14, and UPC-E expansion.
 */
export function barcodeLookupCandidates(raw: string): string[] {
  const trimmed = raw.trim().replace(/[\s-]/g, '')
  const out: string[] = []
  const add = (code: string) => {
    if (/^\d{8}$|^\d{12,14}$/.test(code) && !out.includes(code)) out.push(code)
  }

  if (DIGITS.test(trimmed)) {
    add(trimmed)
    add(normalizeBarcode(trimmed))

    const stripped = trimmed.replace(/^0+/, '')
    if (stripped) {
      add(stripped)
      if (stripped.length === 12) add(`0${stripped}`)
      if (stripped.length <= 13) add(stripped.padStart(13, '0'))
      if (stripped.length <= 14) add(stripped.padStart(14, '0'))
    }

    if (trimmed.length === 13 && trimmed.startsWith('0')) add(trimmed.slice(1))
    if (trimmed.length === 14 && trimmed.startsWith('0')) {
      add(trimmed.slice(1))
      if (trimmed.startsWith('00')) add(trimmed.slice(2))
    }

    if (trimmed.length >= 6 && trimmed.length <= 8) {
      const upcA = expandUpcE(trimmed)
      if (upcA) {
        add(upcA)
        add(`0${upcA}`)
      }
    }
  } else {
    add(normalizeBarcode(raw))
  }

  return out.slice(0, 6)
}

export function barcodesEqual(a: string, b: string): boolean {
  const left = normalizeBarcode(a)
  const right = normalizeBarcode(b)
  if (!left || !right) return false
  return left === right
}

export function findBarcodeMatch(
  items: readonly PantryItem[],
  barcode: string,
): PantryItem | undefined {
  const needle = normalizeBarcode(barcode)
  if (!needle) return undefined
  const matches = items.filter((item) => barcodesEqual(item.barcode, needle))
  matches.sort((a, b) => b.updatedAt - a.updatedAt)
  return matches[0]
}

export function isPlausibleBarcode(raw: string): boolean {
  const value = normalizeBarcode(raw)
  return /^[0-9A-Za-z]{6,20}$/.test(value)
}

export function barcodeSearchHaystack(barcode: string): string {
  const stored = barcode.trim().toLowerCase()
  const normalized = normalizeBarcode(barcode).toLowerCase()
  if (!stored) return ''
  return stored === normalized ? stored : `${stored} ${normalized}`
}
