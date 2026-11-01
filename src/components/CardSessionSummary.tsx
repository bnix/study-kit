import { Rating, type Grade } from 'ts-fsrs'
import type { CardDeck, Flashcard } from '../types'
import { getCardDeckStats } from '../state/cardSchedule'
import type { CardSession, StudyMode } from '../state/useCardSession'
import { ExpandableList } from './ExpandableList'
import { formatInterval } from './formatInterval'
import { Markdown } from './Markdown'

interface CardSessionSummaryProps {
  deck: CardDeck
  session: CardSession
  mode: StudyMode
  onRestart: () => void
  onStudyAll: () => void
  onExit: () => void
}

/** Cards graded in the session that match `include`, each once, in first-graded order. */
function uniqueCards(deck: CardDeck, session: CardSession, include: (rating: Grade) => boolean): Flashcard[] {
  const ids = new Set(session.grades.filter((g) => include(g.rating)).map((g) => g.cardId))
  return [...ids].flatMap((id) => deck.cards.filter((c) => c.id === id))
}

export function CardSessionSummary({ deck, session, mode, onRestart, onStudyAll, onExit }: CardSessionSummaryProps) {
  const { grades, states, canUndo, undo } = session
  const studied = uniqueCards(deck, session, () => true)
  const againCards = uniqueCards(deck, session, (r) => r === Rating.Again)
  const againCount = grades.filter((g) => g.rating === Rating.Again).length

  const now = new Date()
  const stats = getCardDeckStats(deck, states, now)

  const heading = grades.length === 0 ? 'All caught up' : mode === 'review' ? 'Review complete' : 'Deck run complete'

  return (
    <div className="session-summary card-summary">
      <h1>{heading}</h1>

      {grades.length > 0 && (
        <p className="summary-line">
          {studied.length} card{studied.length === 1 ? '' : 's'} studied · {againCount} rated Again
        </p>
      )}

      {mode === 'review' && (
        <ul className="summary-next">
          {stats.due > 0 && <li>{stats.due} due now</li>}
          {stats.due === 0 && stats.nextDueAt && <li>Next card due in {formatInterval(now, stats.nextDueAt)}</li>}
          {stats.newToday > 0 && <li>{stats.newToday} new cards available today</li>}
          {stats.studied < stats.total && stats.newToday === 0 && (
            <li>{stats.total - stats.studied} new cards waiting for tomorrow's allowance</li>
          )}
        </ul>
      )}

      {againCards.length > 0 && (
        <>
          <h2>Cards you rated Again</h2>
          <ExpandableList
            items={againCards}
            itemKey={(card) => card.id}
            label={(card) => card.frontText.split('\n')[0]}
            detail={(card) => <Markdown className="review-detail card-back" nodes={card.back} />}
          />
        </>
      )}

      <div className="summary-actions">
        {mode === 'review' && stats.due + stats.newToday > 0 && <button onClick={onRestart}>Keep reviewing</button>}
        <button onClick={onStudyAll}>{mode === 'cram' ? 'Study all again' : `Study all ${deck.cards.length}`}</button>
        {canUndo && (
          <button className="link-button" onClick={undo}>
            Undo last rating
          </button>
        )}
        <button className="link-button" onClick={onExit}>
          Back to decks
        </button>
      </div>
    </div>
  )
}
