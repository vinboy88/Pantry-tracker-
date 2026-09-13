import { DB_NAME, DB_VERSION, STORE_NAME } from '../constants.ts'
import type { PantryItem } from '../types.ts'

const MEMORY_KEY = 'pantry.items.backup'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB failed to open'))
  })
}

function readBackup(): PantryItem[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PantryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeBackup(items: PantryItem[]): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(items))
  } catch {
    /* quota / private mode */
  }
}

export async function loadItems(): Promise<PantryItem[]> {
  try {
    const db = await openDb()
    const items = await new Promise<PantryItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).getAll()
      request.onsuccess = () => resolve((request.result as PantryItem[]) ?? [])
      request.onerror = () => reject(request.error ?? new Error('Failed to read items'))
    })
    db.close()
    writeBackup(items)
    return items
  } catch {
    return readBackup()
  }
}

export async function saveItem(item: PantryItem): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save item'))
      tx.objectStore(STORE_NAME).put(item)
    })
    db.close()
    const all = await loadItems()
    writeBackup(all)
  } catch {
    const items = readBackup()
    const next = items.filter((entry) => entry.id !== item.id)
    next.push(item)
    writeBackup(next)
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Failed to delete item'))
      tx.objectStore(STORE_NAME).delete(id)
    })
    db.close()
    const all = await loadItems()
    writeBackup(all)
  } catch {
    writeBackup(readBackup().filter((item) => item.id !== id))
  }
}

export async function replaceAll(items: PantryItem[]): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Failed to replace items'))
      const store = tx.objectStore(STORE_NAME)
      store.clear()
      for (const item of items) store.put(item)
    })
    db.close()
    writeBackup(items)
  } catch {
    writeBackup(items)
  }
}
