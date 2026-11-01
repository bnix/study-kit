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
  try {
    const raw = localStorage.getItem(storageKey(deckSlug))
    return raw ? (JSON.parse(raw) as PersistedSession) : null
  } catch {
    return null
  }
}

export function saveSession(deckSlug: string, session: PersistedSession): void {
  try {
    localStorage.setItem(storageKey(deckSlug), JSON.stringify(session))
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — session just won't persist.
  }
}

export function clearSession(deckSlug: string): void {
  try {
    localStorage.removeItem(storageKey(deckSlug))
  } catch {
    // localStorage unavailable — nothing to clear.
  }
}
