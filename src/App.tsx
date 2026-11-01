import { useState } from 'react'
import { loadDecks } from './content/loadDecks'
import type { Deck } from './types'
import { DeckPicker } from './components/DeckPicker'
import { MissedLogView } from './components/MissedLogView'
import { QuizView } from './components/QuizView'
import { SessionSummary } from './components/SessionSummary'
import { getMissedQuestions } from './state/history'
import { backfillFromHistory } from './state/missLog'
import { useQuizSession } from './state/useQuizSession'
import './App.css'

type Screen =
  | { kind: 'picker' }
  | { kind: 'missedLog' }
  | { kind: 'quiz'; deck: Deck; missedOnly: boolean }

interface ActiveDeckProps {
  deck: Deck
  missedOnly: boolean
  onExit: () => void
  onRestart: () => void
}

function ActiveDeck({ deck, missedOnly, onExit, onRestart }: ActiveDeckProps) {
  // Snapshot the missed set on mount so answering doesn't reshuffle the session mid-run;
  // a restart remounts and picks up whatever is still missed.
  const [sessionDeck] = useState(() =>
    missedOnly ? { ...deck, questions: getMissedQuestions(deck) } : deck,
  )
  const session = useQuizSession(sessionDeck, { persist: !missedOnly })
  return session.isComplete ? (
    <SessionSummary session={session} missedOnly={missedOnly} onRestart={onRestart} onExit={onExit} />
  ) : (
    <QuizView session={session} onExit={onExit} />
  )
}

export default function App() {
  const [decks] = useState(() => {
    const loaded = loadDecks()
    backfillFromHistory(loaded)
    return loaded
  })
  const [screen, setScreen] = useState<Screen>({ kind: 'picker' })
  // Bumped on every open/restart so a session remounts with fresh state.
  const [sessionKey, setSessionKey] = useState(0)

  function open(next: Screen) {
    setScreen(next)
    setSessionKey((k) => k + 1)
  }
  const toPicker = () => setScreen({ kind: 'picker' })

  function renderScreen() {
    switch (screen.kind) {
      case 'picker':
        return (
          <DeckPicker
            decks={decks}
            onSelect={(deck, missedOnly = false) => open({ kind: 'quiz', deck, missedOnly })}
            onViewMissedLog={() => setScreen({ kind: 'missedLog' })}
          />
        )
      case 'missedLog':
        return <MissedLogView onExit={toPicker} />
      case 'quiz':
        return (
          <ActiveDeck
            key={sessionKey}
            deck={screen.deck}
            missedOnly={screen.missedOnly}
            onExit={toPicker}
            onRestart={() => open(screen)}
          />
        )
    }
  }

  return <main className="app">{renderScreen()}</main>
}
