import { useState } from 'react'
import type { AnyDeck, CardDeck, QuizDeck } from '../types'
import { getMissLog } from '../state/missLog'
import type { StudyMode } from '../state/useCardSession'
import type { QuizMode } from '../state/useQuizSession'
import { CardDeckRow, QuizDeckRow } from './DeckRows'

interface CertGroup {
  cert: string
  quizzes: QuizDeck[]
  cardDecks: CardDeck[]
}

/** Certs appear in the order of their first quiz deck, then certs that only have card decks. */
function groupByCert(decks: AnyDeck[]): CertGroup[] {
  const groups = new Map<string, CertGroup>()
  const quizzesFirst = [...decks].sort((a, b) => Number(a.kind !== 'quiz') - Number(b.kind !== 'quiz'))
  for (const deck of quizzesFirst) {
    const cert = deck.cert ?? 'Other'
    if (!groups.has(cert)) groups.set(cert, { cert, quizzes: [], cardDecks: [] })
    const group = groups.get(cert)!
    if (deck.kind === 'quiz') group.quizzes.push(deck)
    else group.cardDecks.push(deck)
  }
  return [...groups.values()]
}

interface DeckPickerProps {
  decks: AnyDeck[]
  onStudyQuiz: (deck: QuizDeck, mode: QuizMode) => void
  onStudyCards: (deck: CardDeck, mode: StudyMode) => void
  onViewMissedLog: () => void
}

export function DeckPicker({ decks, onStudyQuiz, onStudyCards, onViewMissedLog }: DeckPickerProps) {
  const [missedLogCount] = useState(() => getMissLog().length)

  if (decks.length === 0) {
    return (
      <div className="deck-picker">
        <p>
          No decks found under <code>content/</code>. Add a deck markdown file to your curated vault
          folder and reload.
        </p>
      </div>
    )
  }

  return (
    <div className="deck-picker">
      <h1>Study Kit</h1>
      {missedLogCount > 0 && (
        <p className="missed-log-link">
          <button className="link-button" onClick={onViewMissedLog}>
            View all {missedLogCount} missed questions
          </button>
        </p>
      )}
      {groupByCert(decks).map(({ cert, quizzes, cardDecks }) => (
        <section key={cert}>
          <h2>{cert}</h2>
          {quizzes.length > 0 && (
            <ul>
              {quizzes.map((deck) => (
                <QuizDeckRow key={deck.slug} deck={deck} onStudy={onStudyQuiz} />
              ))}
            </ul>
          )}
          {cardDecks.length > 0 && (
            <>
              <h3 className="group-subhead">Flash cards</h3>
              <ul>
                {cardDecks.map((deck) => (
                  <CardDeckRow key={deck.slug} deck={deck} onStudy={onStudyCards} />
                ))}
              </ul>
            </>
          )}
        </section>
      ))}
    </div>
  )
}
