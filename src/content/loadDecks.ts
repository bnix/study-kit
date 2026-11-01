import type { Deck } from '../types'
import { parseDeck } from './parseDeck'

const rawDeckModules = import.meta.glob<string>('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function slugFromPath(path: string): string {
  return path
    .replace(/^\/content\//, '')
    .replace(/\.md$/, '')
}

let cachedDecks: Deck[] | null = null

/** All decks found under `content/`, parsed once and cached for the session. */
export function loadDecks(): Deck[] {
  if (!cachedDecks) {
    cachedDecks = Object.entries(rawDeckModules)
      .map(([path, raw]) => parseDeck(raw, slugFromPath(path)))
      .sort((a, b) => a.title.localeCompare(b.title))
  }
  return cachedDecks
}
