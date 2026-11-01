import type { CardDeck, Deck } from '../types'
import { getMissLog } from '../state/missLog'
import type { StudyMode } from '../state/useCardSession'
import { CardDeckRow, QuizDeckRow } from './DeckRows'

interface CertGroup {
  cert: string
  quizzes: Deck[]
  cardDecks: CardDeck[]
}

function groupByCert(quizzes: Deck[], cardDecks: CardDeck[]): CertGroup[] {
  const groups = new Map<string, CertGroup>()
  const groupFor = (cert = 'Other') => {
    if (!groups.has(cert)) groups.set(cert, { cert, quizzes: [], cardDecks: [] })
    return groups.get(cert)!
  }
  for (const deck of quizzes) groupFor(deck.cert).quizzes.push(deck)
  for (const deck of cardDecks) groupFor(deck.cert).cardDecks.push(deck)
  return [...groups.values()]
}

interface DeckPickerProps {
  decks: Deck[]
  cardDecks: CardDeck[]
  onSelect: (deck: Deck, practiceMissed?: boolean) => void
  onStudyCards: (deck: CardDeck, mode: StudyMode) => void
  onViewMissedLog: () => void
}

export function DeckPicker({ decks, cardDecks, onSelect, onStudyCards, onViewMissedLog }: DeckPickerProps) {
  if (decks.length === 0 && cardDecks.length === 0) {
    return (
      <div className="deck-picker">
        <p>
          No decks found under <code>content/</code>. Add a deck markdown file to your curated vault
          folder and reload.
        </p>
      </div>
    )
  }

  const missedLogCount = getMissLog().length

  return (
    <div className="deck-picker">
      <h1>Quiz Me</h1>
      {missedLogCount > 0 && (
        <p className="missed-log-link">
          <button className="link-button" onClick={onViewMissedLog}>
            View all {missedLogCount} missed questions
          </button>
        </p>
      )}
      {groupByCert(decks, cardDecks).map(({ cert, quizzes, cardDecks: certCardDecks }) => (
        <section key={cert}>
          <h2>{cert}</h2>
          {quizzes.length > 0 && (
            <ul>
              {quizzes.map((deck) => (
                <QuizDeckRow key={deck.slug} deck={deck} onSelect={onSelect} />
              ))}
            </ul>
          )}
          {certCardDecks.length > 0 && (
            <>
              <h3 className="group-subhead">Flash cards</h3>
              <ul>
                {certCardDecks.map((deck) => (
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
