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
