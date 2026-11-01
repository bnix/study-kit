import type { AttemptRecord, Deck, DeckHistory, Question } from '../types'
import { clearSession } from './session'
import { deckStore } from './storage'

const { get: getHistory, set: saveHistory, clear: clearHistory } = deckStore<DeckHistory>('history', () => ({}))
export { getHistory, clearHistory }

export function recordAttempt(deckSlug: string, questionId: string, wasCorrect: boolean): DeckHistory {
  const history = getHistory(deckSlug)
  const previous = history[questionId]

  const updated: AttemptRecord = {
    attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (wasCorrect ? 1 : 0),
    lastResult: wasCorrect,
    lastAttemptedAt: new Date().toISOString(),
  }

  const nextHistory: DeckHistory = { ...history, [questionId]: updated }
  saveHistory(deckSlug, nextHistory)
  return nextHistory
}

/** A quiz deck's "Reset": its attempt history and any in-progress session. The miss log is kept. */
export function resetQuizProgress(deckSlug: string): void {
  clearHistory(deckSlug)
  clearSession(deckSlug)
}

export interface DeckStats {
  total: number
  attempted: number
  mastered: number
  missed: number
}

export function getDeckStats(deck: Deck): DeckStats {
  const history = getHistory(deck.slug)
  let attempted = 0
  let mastered = 0

  for (const { id } of deck.questions) {
    const record = history[id]
    if (!record) continue
    attempted += 1
    if (record.lastResult) mastered += 1
  }

  return { total: deck.questions.length, attempted, mastered, missed: attempted - mastered }
}

/** Questions whose most recent attempt was wrong, in deck order. */
export function getMissedQuestions(deck: Deck): Question[] {
  const history = getHistory(deck.slug)
  return deck.questions.filter((q) => history[q.id] && !history[q.id].lastResult)
}
