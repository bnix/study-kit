import type { AttemptRecord, Deck, DeckHistory, Question } from '../types'
import { readJson, removeKey, writeJson } from './storage'

function storageKey(deckSlug: string): string {
  return `quizme:history:${deckSlug}`
}

export function getHistory(deckSlug: string): DeckHistory {
  return readJson<DeckHistory>(storageKey(deckSlug), {})
}

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
  writeJson(storageKey(deckSlug), nextHistory)
  return nextHistory
}

export function clearHistory(deckSlug: string): void {
  removeKey(storageKey(deckSlug))
}

export interface DeckStats {
  total: number
  attempted: number
  mastered: number
  missed: number
}

export function getDeckStats(deckSlug: string, questionIds: string[]): DeckStats {
  const history = getHistory(deckSlug)
  let attempted = 0
  let mastered = 0

  for (const id of questionIds) {
    const record = history[id]
    if (!record) continue
    attempted += 1
    if (record.lastResult) mastered += 1
  }

  return { total: questionIds.length, attempted, mastered, missed: attempted - mastered }
}

/** Questions whose most recent attempt was wrong, in deck order. */
export function getMissedQuestions(deck: Deck): Question[] {
  const history = getHistory(deck.slug)
  return deck.questions.filter((q) => history[q.id] && !history[q.id].lastResult)
}
