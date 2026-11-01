import { useState } from 'react'
import { loadCardDecks, loadDecks } from './content/loadDecks'
import type { CardDeck, Deck } from './types'
import { CardSessionSummary } from './components/CardSessionSummary'
import { CardStudyView } from './components/CardStudyView'
import { DeckPicker } from './components/DeckPicker'
import { MissedLogView } from './components/MissedLogView'
import { QuizView } from './components/QuizView'
import { SessionSummary } from './components/SessionSummary'
import { backfillFromHistory } from './state/missLog'
import { useCardSession, type StudyMode } from './state/useCardSession'
import { useQuizSession, type QuizMode } from './state/useQuizSession'
import './App.css'

type Screen =
  | { kind: 'picker' }
  | { kind: 'missedLog' }
  | { kind: 'quiz'; deck: Deck; mode: QuizMode }
  | { kind: 'cards'; deck: CardDeck; mode: StudyMode }

interface ActiveQuizProps {
  deck: Deck
  mode: QuizMode
  onExit: () => void
  onRestart: () => void
}

function ActiveQuiz({ deck, mode, onExit, onRestart }: ActiveQuizProps) {
  const session = useQuizSession(deck, mode)
  return session.isComplete ? (
    <SessionSummary session={session} onRestart={onRestart} onExit={onExit} />
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
      session={session}
      onRestart={() => onStudy('review')}
      onStudyAll={() => onStudy('cram')}
      onExit={onExit}
    />
  ) : (
    <CardStudyView session={session} onExit={onExit} />
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
            onStudyQuiz={(deck, mode) => open({ kind: 'quiz', deck, mode })}
            onStudyCards={(deck, mode) => open({ kind: 'cards', deck, mode })}
            onViewMissedLog={() => setScreen({ kind: 'missedLog' })}
          />
        )
      case 'missedLog':
        return <MissedLogView onExit={toPicker} />
      case 'quiz':
        return (
          <ActiveQuiz
            key={sessionKey}
            deck={screen.deck}
            mode={screen.mode}
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
