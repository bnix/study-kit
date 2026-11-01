/**
 * The app's only localStorage access. Storage can be unavailable (private
 * browsing, quota, blocked site data), so every helper fails soft: reads fall
 * back, and writes are dropped — progress just won't persist.
 */

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable — see module comment.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage unavailable — nothing to remove.
  }
}

/** Whether `key` holds any value, regardless of format. False when storage is unavailable. */
export function hasKey(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

/**
 * Every key the app stores. The `quizme:` prefix predates the rename to Study Kit and
 * stays so existing progress keeps loading.
 */
export function storageKey(name: string): string {
  return `quizme:${name}`
}

/**
 * Get/set/clear for one JSON value per deck, stored under `<namespace>:<deckSlug>`.
 * `empty` builds the value for a deck with nothing saved, fresh on each read so
 * callers can't mutate a shared default.
 */
export function deckStore<T>(namespace: string, empty: () => T) {
  const key = (deckSlug: string) => storageKey(`${namespace}:${deckSlug}`)
  return {
    get: (deckSlug: string): T => readJson(key(deckSlug), empty()),
    set: (deckSlug: string, value: T): void => writeJson(key(deckSlug), value),
    clear: (deckSlug: string): void => removeKey(key(deckSlug)),
  }
}
