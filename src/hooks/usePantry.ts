import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_UNIT } from '../constants.ts'
import { isExpiringConcern } from '../lib/dates.ts'
import { clampQuantity } from '../lib/query.ts'
import { sampleItems } from '../lib/sampleData.ts'
import { deleteItem, loadItems, replaceAll, saveItem } from '../lib/storage.ts'
import type { ItemDraft, PantryItem } from '../types.ts'

function newId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function emptyDraft(): ItemDraft {
  return {
    name: '',
    quantity: 1,
    unit: DEFAULT_UNIT,
    category: '',
    expiryDate: '',
    notes: '',
  }
}

export function draftFromItem(item: PantryItem): ItemDraft {
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiryDate: item.expiryDate ?? '',
    notes: item.notes,
  }
}

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadItems()
      .then((loaded) => {
        if (!cancelled) {
          setItems(loaded)
          setReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load pantry items.')
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const upsert = useCallback(async (item: PantryItem) => {
    setItems((current) => {
      const exists = current.some((entry) => entry.id === item.id)
      return exists ? current.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...current]
    })
    await saveItem(item)
  }, [])

  const addItem = useCallback(
    async (draft: ItemDraft) => {
      const now = Date.now()
      const item: PantryItem = {
        id: newId(),
        name: draft.name.trim(),
        quantity: clampQuantity(draft.quantity),
        unit: draft.unit || DEFAULT_UNIT,
        category: draft.category.trim(),
        expiryDate: draft.expiryDate || null,
        notes: draft.notes.trim(),
        createdAt: now,
        updatedAt: now,
      }
      await upsert(item)
      return item
    },
    [upsert],
  )

  const updateItem = useCallback(
    async (id: string, draft: ItemDraft) => {
      const existing = items.find((item) => item.id === id)
      if (!existing) return
      const item: PantryItem = {
        ...existing,
        name: draft.name.trim(),
        quantity: clampQuantity(draft.quantity),
        unit: draft.unit || DEFAULT_UNIT,
        category: draft.category.trim(),
        expiryDate: draft.expiryDate || null,
        notes: draft.notes.trim(),
        updatedAt: Date.now(),
      }
      await upsert(item)
    },
    [items, upsert],
  )

  const removeItem = useCallback(async (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    await deleteItem(id)
  }, [])

  const patchItem = useCallback(
    async (id: string, mutate: (item: PantryItem) => PantryItem) => {
      let next: PantryItem | null = null
      setItems((current) => {
        const existing = current.find((item) => item.id === id)
        if (!existing) return current
        next = mutate(existing)
        return current.map((item) => (item.id === id ? next! : item))
      })
      if (next) await saveItem(next)
    },
    [],
  )

  const adjustQuantity = useCallback(
    async (id: string, delta: number) => {
      await patchItem(id, (existing) => ({
        ...existing,
        quantity: clampQuantity(existing.quantity + delta),
        updatedAt: Date.now(),
      }))
    },
    [patchItem],
  )

  const markEmpty = useCallback(
    async (id: string) => {
      await patchItem(id, (existing) => ({
        ...existing,
        quantity: 0,
        updatedAt: Date.now(),
      }))
    },
    [patchItem],
  )

  const loadSamples = useCallback(async () => {
    const samples = sampleItems()
    setItems(samples)
    await replaceAll(samples)
  }, [])

  const stats = useMemo(
    () => ({
      total: items.length,
      empty: items.filter((item) => item.quantity <= 0).length,
      expiring: items.filter(isExpiringConcern).length,
    }),
    [items],
  )

  return {
    items,
    ready,
    error,
    stats,
    addItem,
    updateItem,
    removeItem,
    adjustQuantity,
    markEmpty,
    loadSamples,
  }
}
