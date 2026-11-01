import { useState } from 'react'
import { loadCardDecks, loadDecks } from './content/loadDecks'
import type { CardDeck, Deck } from './types'
import { CardSessionSummary } from './components/CardSessionSummary'
import { CardStudyView } from './components/CardStudyView'
import { DeckPicker } from './components/DeckPicker'
import { MissedLogView } from './components/MissedLogView'
import { QuizView } from './components/QuizView'
import { SessionSummary } from './components/SessionSummary'
import { getMissedQuestions } from './state/history'
import { backfillFromHistory } from './state/missLog'
import { useCardSession, type StudyMode } from './state/useCardSession'
import { useQuizSession } from './state/useQuizSession'
import './App.css'

type Screen =
  | { kind: 'picker' }
  | { kind: 'missedLog' }
  | { kind: 'quiz'; deck: Deck; missedOnly: boolean }
  | { kind: 'cards'; deck: CardDeck; mode: StudyMode }

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

interface ActiveCardDeckProps {
  deck: CardDeck
  mode: StudyMode
  onExit: () => void
  onStudy: (mode: StudyMode) => void
}

function ActiveCardDeck({ deck, mode, onExit, onStudy }: ActiveCardDeckProps) {
  const session = useCardSession(deck, mode)
  return session.isComplete ? (
    <CardSessionSummary
      deck={deck}
      session={session}
      mode={mode}
      onRestart={() => onStudy('review')}
      onStudyAll={() => onStudy('cram')}
      onExit={onExit}
    />
  ) : (
    <CardStudyView session={session} mode={mode} onExit={onExit} />
  )
}

export default function App() {
  const [decks] = useState(() => {
    const loaded = loadDecks()
    backfillFromHistory(loaded)
    return loaded
  })
  const [cardDecks] = useState(loadCardDecks)
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
            cardDecks={cardDecks}
            onSelect={(deck, missedOnly = false) => open({ kind: 'quiz', deck, missedOnly })}
            onStudyCards={(deck, mode) => open({ kind: 'cards', deck, mode })}
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
      case 'cards':
        return (
          <ActiveCardDeck
            key={sessionKey}
            deck={screen.deck}
            mode={screen.mode}
            onExit={toPicker}
            onStudy={(mode) => open({ ...screen, mode })}
          />
        )
    }
  }

  return <main className="app">{renderScreen()}</main>
}
