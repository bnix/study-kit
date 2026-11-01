import { useState } from 'react'
import type { CardDeck, Deck } from '../types'
import { clearCardStates, getCardDeckStats, getCardStates } from './cardSchedule'
import { getDeckStats, resetQuizProgress } from './history'
import { loadSession } from './session'

/**
 * A deck's saved progress for the deck picker, read from storage once on mount.
 * Nothing else changes it while the picker is showing, so only `reset` re-reads.
 */
function useStoredProgress<T>(read: () => T, clear: () => void) {
  const [progress, setProgress] = useState(read)
  function reset() {
    clear()
    setProgress(read())
  }
  return { ...progress, reset }
}

export function useQuizDeckProgress(deck: Deck) {
  return useStoredProgress(
    () => ({ stats: getDeckStats(deck), inProgress: loadSession(deck.slug) !== null }),
    () => resetQuizProgress(deck.slug),
  )
}

/** `now` is the time the stats were computed at, for labelling intervals consistently with them. */
export function useCardDeckProgress(deck: CardDeck) {
  return useStoredProgress(
    () => {
      const now = new Date()
      return { now, stats: getCardDeckStats(deck, getCardStates(deck.slug), now) }
    },
    () => clearCardStates(deck.slug),
  )
}
