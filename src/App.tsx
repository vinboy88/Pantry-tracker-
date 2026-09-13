import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from './components/EmptyState.tsx'
import { Header } from './components/Header.tsx'
import { InstallHint } from './components/InstallHint.tsx'
import { ItemCard } from './components/ItemCard.tsx'
import { ItemEditor } from './components/ItemEditor.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { Welcome } from './components/Welcome.tsx'
import { CATEGORIES, INSTALL_HINT_KEY, WELCOME_KEY } from './constants.ts'
import { usePantry } from './hooks/usePantry.ts'
import { filterAndSort, uniqueCategories } from './lib/query.ts'
import { applyTheme, isStandalone, readThemeMode } from './lib/theme.ts'
import type { ItemDraft, SortMode, StockFilter, ThemeMode } from './types.ts'

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
}

export default function App() {
  const pantry = usePantry()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [stock, setStock] = useState<StockFilter>('all')
  const [sort, setSort] = useState<SortMode>('updated')
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => readThemeMode())
  const [editorId, setEditorId] = useState<string | 'new' | null>(null)
  const [showWelcome, setShowWelcome] = useState(() => !readFlag(WELCOME_KEY))
  const [showInstallHint, setShowInstallHint] = useState(
    () => !readFlag(INSTALL_HINT_KEY) && !isStandalone(),
  )

  useEffect(() => {
    applyTheme(themeMode)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (themeMode === 'system') applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themeMode])

  const categories = useMemo(
    () => uniqueCategories(pantry.items, CATEGORIES),
    [pantry.items],
  )

  const visible = useMemo(
    () => filterAndSort(pantry.items, query, category, stock, sort),
    [pantry.items, query, category, stock, sort],
  )

  const editingItem = editorId && editorId !== 'new'
    ? (pantry.items.find((item) => item.id === editorId) ?? null)
    : null

  const cycleTheme = () => {
    const order: ThemeMode[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(themeMode) + 1) % order.length]
    setThemeMode(next)
  }

  const closeWelcome = () => {
    writeFlag(WELCOME_KEY)
    setShowWelcome(false)
  }

  const saveDraft = async (draft: ItemDraft) => {
    if (editorId && editorId !== 'new') {
      await pantry.updateItem(editorId, draft)
      return
    }
    await pantry.addItem(draft)
  }

  const filteredEmpty = pantry.items.length > 0 && visible.length === 0

  return (
    <div className="app">
      <Header
        themeMode={themeMode}
        onCycleTheme={cycleTheme}
        total={pantry.stats.total}
        expiring={pantry.stats.expiring}
        empty={pantry.stats.empty}
      />

      <Toolbar
        query={query}
        onQuery={setQuery}
        category={category}
        onCategory={setCategory}
        categories={categories}
        stock={stock}
        onStock={setStock}
        sort={sort}
        onSort={setSort}
      />

      {showInstallHint && !showWelcome ? (
        <InstallHint
          onDismiss={() => {
            writeFlag(INSTALL_HINT_KEY)
            setShowInstallHint(false)
          }}
        />
      ) : null}

      <main className="feed">
        {!pantry.ready ? (
          <p className="loading">Opening pantry…</p>
        ) : pantry.error ? (
          <p className="form-error">{pantry.error}</p>
        ) : visible.length === 0 ? (
          <EmptyState
            filtered={filteredEmpty}
            onAdd={() => setEditorId('new')}
            onSample={() => void pantry.loadSamples()}
          />
        ) : (
          <ul className="item-list">
            {visible.map((item) => (
              <li key={item.id}>
                <ItemCard
                  item={item}
                  onOpen={() => setEditorId(item.id)}
                  onAdjust={(delta) => void pantry.adjustQuantity(item.id, delta)}
                  onEmpty={() => void pantry.markEmpty(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {pantry.ready ? (
        <button
          type="button"
          className="fab"
          aria-label="Add pantry item"
          onClick={() => setEditorId('new')}
        >
          +
        </button>
      ) : null}

      {editorId ? (
        <ItemEditor
          item={editingItem}
          onClose={() => setEditorId(null)}
          onSave={saveDraft}
          onDelete={
            editingItem
              ? async () => {
                  await pantry.removeItem(editingItem.id)
                }
              : undefined
          }
        />
      ) : null}

      {showWelcome ? (
        <Welcome onDismiss={closeWelcome} standalone={isStandalone()} />
      ) : null}
    </div>
  )
}
