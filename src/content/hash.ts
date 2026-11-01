/**
 * Stable, dependency-free string hash (djb2) used to derive question IDs from
 * their prompt text, so history tracking survives reordering questions
 * within a deck.
 */
export function hashText(text: string): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ')

  let hash = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i)
  }

  return (hash >>> 0).toString(16)
}
