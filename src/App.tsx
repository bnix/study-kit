import { useState } from 'react'
import { loadDecks } from './content/loadDecks'
import type { Deck } from './types'
import { DeckPicker } from './components/DeckPicker'
import { QuizView } from './components/QuizView'
import { SessionSummary } from './components/SessionSummary'
import { useQuizSession } from './state/useQuizSession'
import './App.css'

interface ActiveDeckProps {
  deck: Deck
  onExit: () => void
  onRestart: () => void
}

function ActiveDeck({ deck, onExit, onRestart }: ActiveDeckProps) {
  const session = useQuizSession(deck)
  return session.isComplete ? (
    <SessionSummary session={session} onRestart={onRestart} onExit={onExit} />
  ) : (
    <QuizView session={session} onExit={onExit} />
  )
}

export default function App() {
  const [decks] = useState(() => loadDecks())
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [sessionKey, setSessionKey] = useState(0)

  function selectDeck(deck: Deck) {
    setSelectedDeck(deck)
    setSessionKey((k) => k + 1)
  }

  return (
    <main className="app">
      {selectedDeck ? (
        <ActiveDeck
          key={`${selectedDeck.slug}-${sessionKey}`}
          deck={selectedDeck}
          onExit={() => setSelectedDeck(null)}
          onRestart={() => setSessionKey((k) => k + 1)}
        />
      ) : (
        <DeckPicker decks={decks} onSelect={selectDeck} />
      )}
    </main>
  )
}
