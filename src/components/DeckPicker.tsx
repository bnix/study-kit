import type { Deck } from '../types'
import { getMissLog } from '../state/missLog'
import { QuizDeckRow } from './DeckRows'

interface CertGroup {
  cert: string
  quizzes: Deck[]
}

function groupByCert(quizzes: Deck[]): CertGroup[] {
  const groups = new Map<string, CertGroup>()
  const groupFor = (cert = 'Other') => {
    if (!groups.has(cert)) groups.set(cert, { cert, quizzes: [] })
    return groups.get(cert)!
  }
  for (const deck of quizzes) groupFor(deck.cert).quizzes.push(deck)
  return [...groups.values()]
}

interface DeckPickerProps {
  decks: Deck[]
  onSelect: (deck: Deck, practiceMissed?: boolean) => void
  onViewMissedLog: () => void
}

export function DeckPicker({ decks, onSelect, onViewMissedLog }: DeckPickerProps) {
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
      {groupByCert(decks).map(({ cert, quizzes }) => (
        <section key={cert}>
          <h2>{cert}</h2>
          <ul>
            {quizzes.map((deck) => (
              <QuizDeckRow key={deck.slug} deck={deck} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
