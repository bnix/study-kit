import { readJson, removeKey, writeJson } from './storage'

export interface PersistedResult {
  questionId: string
  correct: boolean
}

export interface PersistedSession {
  questionIndex: number
  selected: string[]
  answered: boolean
  results: PersistedResult[]
}

function storageKey(deckSlug: string): string {
  return `quizme:session:${deckSlug}`
}

export function loadSession(deckSlug: string): PersistedSession | null {
  return readJson<PersistedSession | null>(storageKey(deckSlug), null)
}

export function saveSession(deckSlug: string, session: PersistedSession): void {
  writeJson(storageKey(deckSlug), session)
}

export function clearSession(deckSlug: string): void {
  removeKey(storageKey(deckSlug))
}
