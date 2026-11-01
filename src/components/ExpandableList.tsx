import { useState, type ReactNode } from 'react'

interface ExpandableListProps<T> {
  items: T[]
  itemKey: (item: T) => string
  label: (item: T) => ReactNode
  detail: (item: T) => ReactNode
  /** Always-visible line under the label. */
  meta?: (item: T) => ReactNode
}

/** A list of toggle links where at most one item's detail is open at a time. */
export function ExpandableList<T>({ items, itemKey, label, detail, meta }: ExpandableListProps<T>) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  return (
    <ul className="missed-list">
      {items.map((item) => {
        const key = itemKey(item)
        const expanded = expandedKey === key
        return (
          <li key={key}>
            <button className="link-button" onClick={() => setExpandedKey(expanded ? null : key)}>
              {label(item)}
            </button>
            {meta && <div className="missed-log-meta">{meta(item)}</div>}
            {expanded && detail(item)}
          </li>
        )
      })}
    </ul>
  )
}
