import type { AttemptRecord, DeckHistory } from '../types'

function storageKey(deckSlug: string): string {
  return `quizme:history:${deckSlug}`
}

export function getHistory(deckSlug: string): DeckHistory {
  try {
    const raw = localStorage.getItem(storageKey(deckSlug))
    return raw ? (JSON.parse(raw) as DeckHistory) : {}
  } catch {
    return {}
  }
}

function saveHistory(deckSlug: string, history: DeckHistory): void {
  try {
    localStorage.setItem(storageKey(deckSlug), JSON.stringify(history))
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — history just won't persist.
  }
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
  saveHistory(deckSlug, nextHistory)
  return nextHistory
}

export function clearHistory(deckSlug: string): void {
  try {
    localStorage.removeItem(storageKey(deckSlug))
  } catch {
    // localStorage unavailable — nothing to clear.
  }
}

export interface DeckStats {
  total: number
  attempted: number
  mastered: number
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

  return { total: questionIds.length, attempted, mastered }
}
