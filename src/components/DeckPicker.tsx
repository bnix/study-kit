import type { Deck } from '../types'
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
  onSelect: (deck: Deck) => void
}

export function DeckPicker({ decks, onSelect }: DeckPickerProps) {
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
      <h1>Quiz Me</h1>
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
