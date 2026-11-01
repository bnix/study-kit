import { deckStore } from './storage'

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

/** The in-progress full-deck quiz, saved so a reload resumes where it left off. */
export const {
  get: loadSession,
  set: saveSession,
  clear: clearSession,
} = deckStore<PersistedSession | null>('session', () => null)
