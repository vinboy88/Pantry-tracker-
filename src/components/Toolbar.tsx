import type { SortMode, StockFilter } from '../types.ts'

interface ToolbarProps {
  query: string
  onQuery: (value: string) => void
  category: string
  onCategory: (value: string) => void
  categories: string[]
  stock: StockFilter
  onStock: (value: StockFilter) => void
  sort: SortMode
  onSort: (value: SortMode) => void
}

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'expiry', label: 'Expiry' },
  { id: 'updated', label: 'Updated' },
]

const STOCKS: { id: StockFilter; label: string }[] = [
  { id: 'expiring', label: 'Expiring' },
  { id: 'empty', label: 'Out' },
]

export function Toolbar({
  query,
  onQuery,
  category,
  onCategory,
  categories,
  stock,
  onStock,
  sort,
  onSort,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <label className="search">
        <span className="sr-only">Search pantry</span>
        <input
          type="search"
          placeholder="Search by name"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
        />
      </label>

      <div className="seg" role="tablist" aria-label="Sort items">
        {SORTS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={sort === option.id}
            className={sort === option.id ? 'is-on' : undefined}
            onClick={() => onSort(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="chips" role="tablist" aria-label="Filter items">
        {STOCKS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`chip ${stock === option.id ? 'is-on' : ''}`}
            onClick={() => onStock(stock === option.id ? 'all' : option.id)}
          >
            {option.label}
          </button>
        ))}
        <span className="chip-rule" aria-hidden="true" />
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            className={`chip ${category === name ? 'is-on' : ''}`}
            onClick={() => onCategory(category === name ? 'all' : name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
