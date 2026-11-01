import { useReducer } from 'react'
import type { Deck } from '../types'
import { clearHistory, getDeckStats } from '../state/history'
import { clearSession, loadSession } from '../state/session'
import { Meter } from './Meter'

// Rows read their stats straight from storage at render; a reset bumps this to re-read.
const useRefresh = () => useReducer((n: number) => n + 1, 0)[1]

interface ResetButtonProps {
  confirmText: string
  onConfirm: () => void
}

function ResetButton({ confirmText, onConfirm }: ResetButtonProps) {
  function reset() {
    if (window.confirm(`${confirmText} This can't be undone.`)) onConfirm()
  }
  return (
    <button className="link-button reset-progress" onClick={reset}>
      Reset
    </button>
  )
}

interface QuizDeckRowProps {
  deck: Deck
  onSelect: (deck: Deck, practiceMissed?: boolean) => void
}

export function QuizDeckRow({ deck, onSelect }: QuizDeckRowProps) {
  const refresh = useRefresh()
  const stats = getDeckStats(
    deck.slug,
    deck.questions.map((q) => q.id),
  )
  const inProgress = loadSession(deck.slug) !== null
  const hasStats = stats.attempted > 0

  return (
    <li className="deck-row">
      <button className="deck-select" onClick={() => onSelect(deck)}>
        <span className="deck-title">{deck.title}</span>
        <span className="deck-count">{deck.questions.length} questions</span>
      </button>
      {(hasStats || inProgress) && (
        <div className="deck-meta-row">
          {hasStats && (
            <>
              <Meter className="deck-meter" value={stats.mastered} max={stats.total} />
              <span>
                {stats.mastered}/{stats.total} mastered
              </span>
            </>
          )}
          {inProgress && <span className="deck-status">in progress</span>}
          {stats.missed > 0 && (
            <button className="link-button practice-missed" onClick={() => onSelect(deck, true)}>
              Practice {stats.missed} missed
            </button>
          )}
          {hasStats && (
            <ResetButton
              confirmText={`Reset all saved progress for "${deck.title}"?`}
              onConfirm={() => {
                clearHistory(deck.slug)
                clearSession(deck.slug)
                refresh()
              }}
            />
          )}
        </div>
      )}
    </li>
  )
}
