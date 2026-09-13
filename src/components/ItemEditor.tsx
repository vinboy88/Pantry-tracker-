import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CATEGORIES, UNITS } from '../constants.ts'
import { emptyDraft } from '../hooks/usePantry.ts'
import type { ItemDraft, PantryItem } from '../types.ts'

interface ItemEditorProps {
  item: PantryItem | null
  onClose: () => void
  onSave: (draft: ItemDraft) => Promise<void>
  onDelete?: () => Promise<void>
}

export function ItemEditor({ item, onClose, onSave, onDelete }: ItemEditorProps) {
  const titleId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<ItemDraft>(item ? draftFrom(item) : emptyDraft())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [customCategory, setCustomCategory] = useState(
    item?.category && !CATEGORIES.includes(item.category as (typeof CATEGORIES)[number])
      ? item.category
      : '',
  )

  useEffect(() => {
    const timer = window.setTimeout(() => nameRef.current?.focus(), 80)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const categoryValue = customCategory || draft.category

  const categoryOptions = useMemo(() => {
    if (customCategory && !CATEGORIES.includes(customCategory as (typeof CATEGORIES)[number])) {
      return [...CATEGORIES, customCategory]
    }
    return CATEGORIES
  }, [customCategory])

  const setField = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const submit = async () => {
    if (!draft.name.trim()) {
      setError('Give this item a name.')
      nameRef.current?.focus()
      return
    }
    setBusy(true)
    try {
      await onSave({
        ...draft,
        category: categoryValue.trim(),
        quantity: Number(draft.quantity),
      })
      onClose()
    } catch {
      setError('Could not save. Try again.')
      setBusy(false)
    }
  }

  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="sheet-backdrop" aria-label="Close editor" onClick={onClose} />
      <section className="sheet editor-sheet">
        <header className="editor-head">
          <button type="button" className="text-btn" onClick={onClose}>
            Cancel
          </button>
          <h2 id={titleId}>{item ? 'Edit item' : 'New item'}</h2>
          <button type="button" className="text-btn save-link" onClick={() => void submit()} disabled={busy}>
            Save
          </button>
        </header>

        <form
          className="editor-form"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <label>
            Name
            <input
              ref={nameRef}
              value={draft.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="e.g. Olive oil"
              autoComplete="off"
              autoCorrect="on"
              maxLength={80}
            />
          </label>

          <div className="field-row">
            <label>
              Quantity
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={Number.isFinite(draft.quantity) ? draft.quantity : 0}
                onChange={(event) => setField('quantity', Number(event.target.value))}
              />
            </label>
            <label>
              Unit
              <select value={draft.unit} onChange={(event) => setField('unit', event.target.value)}>
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
                {draft.unit && !UNITS.includes(draft.unit as (typeof UNITS)[number]) ? (
                  <option value={draft.unit}>{draft.unit}</option>
                ) : null}
              </select>
            </label>
          </div>

          <fieldset>
            <legend>Category</legend>
            <div className="chips wrap">
              <button
                type="button"
                className={`chip ${categoryValue === '' && !customCategory ? 'is-on' : ''}`}
                onClick={() => {
                  setCustomCategory('')
                  setField('category', '')
                }}
              >
                None
              </button>
              {categoryOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`chip ${categoryValue === name ? 'is-on' : ''}`}
                  onClick={() => {
                    setCustomCategory('')
                    setField('category', name)
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <input
              className="category-custom"
              value={customCategory}
              onChange={(event) => {
                setCustomCategory(event.target.value)
                setField('category', event.target.value)
              }}
              placeholder="Or type a custom category"
              autoComplete="off"
            />
          </fieldset>

          <label>
            Expiry date
            <input
              type="date"
              value={draft.expiryDate}
              onChange={(event) => setField('expiryDate', event.target.value)}
            />
          </label>

          <label>
            Notes
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(event) => setField('notes', event.target.value)}
              placeholder="Opened, location, brand…"
              maxLength={240}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-btn" disabled={busy}>
            {item ? 'Save changes' : 'Add to pantry'}
          </button>

          {onDelete ? (
            <button
              type="button"
              className="danger-btn"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true)
                  return
                }
                void onDelete().then(onClose)
              }}
            >
              {confirmDelete ? 'Tap again to delete' : 'Delete item'}
            </button>
          ) : null}
        </form>
      </section>
    </div>
  )
}

function draftFrom(item: PantryItem): ItemDraft {
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiryDate: item.expiryDate ?? '',
    notes: item.notes,
  }
}
