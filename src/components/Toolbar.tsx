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
  lowCount: number
}

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'expiry', label: 'Expiry' },
  { id: 'updated', label: 'Updated' },
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
  lowCount,
}: ToolbarProps) {
  const stocks: { id: StockFilter; label: string }[] = [
    { id: 'low', label: lowCount > 0 ? `Low ${lowCount}` : 'Low' },
    { id: 'expiring', label: 'Expiring' },
    { id: 'empty', label: 'Out' },
  ]

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
        {stocks.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`chip ${stock === option.id ? 'is-on' : ''} ${option.id === 'low' && lowCount > 0 && stock !== 'low' ? 'chip-alert' : ''}`}
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
