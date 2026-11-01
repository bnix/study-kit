import type { CardDeck, Deck } from '../types'
import { parseDeckMeta } from './frontmatter'
import { parseCardDeck } from './parseCardDeck'
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

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title)

let cachedDecks: { quizzes: Deck[]; cardDecks: CardDeck[] } | null = null

function loadAll() {
  if (!cachedDecks) {
    const quizzes: Deck[] = []
    const cardDecks: CardDeck[] = []
    for (const [path, raw] of Object.entries(rawDeckModules)) {
      const meta = parseDeckMeta(raw)
      const slug = slugFromPath(path)
      if (meta.kind === 'flashcards') cardDecks.push(parseCardDeck(meta, slug))
      else quizzes.push(parseDeck(meta, slug))
    }
    cachedDecks = { quizzes: quizzes.sort(byTitle), cardDecks: cardDecks.sort(byTitle) }
  }
  return cachedDecks
}

/** All quiz decks found under `content/`, parsed once and cached for the session. */
export function loadDecks(): Deck[] {
  return loadAll().quizzes
}

/** All flash card decks (`kind: flashcards`) found under `content/`. */
export function loadCardDecks(): CardDeck[] {
  return loadAll().cardDecks
}
