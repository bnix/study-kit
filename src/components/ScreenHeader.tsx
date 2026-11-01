import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  onExit: () => void
  /** Right-aligned status, e.g. a progress counter. */
  children?: ReactNode
}

/** "Back to decks" bar shared by every screen other than the deck picker. */
export function ScreenHeader({ onExit, children }: ScreenHeaderProps) {
  return (
    <div className="screen-header">
      <button className="link-button" onClick={onExit}>
        &larr; Back to decks
      </button>
      {children}
    </div>
  )
}
