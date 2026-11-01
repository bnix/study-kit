import { useReducer } from 'react'
import type { CardDeck, Deck } from '../types'
import { clearCardStates, getCardDeckStats, getCardStates } from '../state/cardSchedule'
import { clearHistory, getDeckStats } from '../state/history'
import { clearSession, loadSession } from '../state/session'
import type { StudyMode } from '../state/useCardSession'
import type { QuizMode } from '../state/useQuizSession'
import { formatInterval } from './formatInterval'
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
  onStudy: (deck: Deck, mode: QuizMode) => void
}

export function QuizDeckRow({ deck, onStudy }: QuizDeckRowProps) {
  const refresh = useRefresh()
  const stats = getDeckStats(
    deck.slug,
    deck.questions.map((q) => q.id),
  )
  const inProgress = loadSession(deck.slug) !== null
  const hasStats = stats.attempted > 0

  return (
    <li className="deck-row">
      <button className="deck-select" onClick={() => onStudy(deck, 'full')}>
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
            <button className="link-button practice-missed" onClick={() => onStudy(deck, 'missed')}>
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

interface CardDeckRowProps {
  deck: CardDeck
  onStudy: (deck: CardDeck, mode: StudyMode) => void
}

export function CardDeckRow({ deck, onStudy }: CardDeckRowProps) {
  const refresh = useRefresh()
  const now = new Date()
  const stats = getCardDeckStats(deck, getCardStates(deck.slug), now)

  return (
    <li className="deck-row">
      <button className="deck-select" onClick={() => onStudy(deck, 'review')}>
        <span className="deck-title">{deck.title}</span>
        <span className="deck-count">{deck.cards.length} cards</span>
      </button>
      <div className="deck-meta-row">
        {stats.studied > 0 && (
          <>
            <Meter className="deck-meter" value={stats.learned} max={stats.total} />
            <span>
              {stats.learned}/{stats.total} learned
            </span>
          </>
        )}
        {stats.due + stats.newToday > 0 ? (
          <span className="deck-status">
            {stats.due} due · {stats.newToday} new
          </span>
        ) : (
          stats.nextDueAt && <span>next in {formatInterval(now, stats.nextDueAt)}</span>
        )}
        <button className="link-button" onClick={() => onStudy(deck, 'cram')}>
          Study all
        </button>
        {stats.studied > 0 && (
          <ResetButton
            confirmText={`Reset the review schedule for "${deck.title}"?`}
            onConfirm={() => {
              clearCardStates(deck.slug)
              refresh()
            }}
          />
        )}
      </div>
      {deck.warnings.length > 0 && (
        <details className="deck-warnings">
          <summary>
            {deck.warnings.length} card{deck.warnings.length === 1 ? '' : 's'} skipped
          </summary>
          <ul>
            {deck.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </li>
  )
}
