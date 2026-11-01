import type { AnyDeck } from '../types'
import { parseDeckMeta } from './frontmatter'
import { parseCardDeck } from './parseCardDeck'
import { parseQuizDeck } from './parseQuizDeck'

const contentModules = import.meta.glob<string>('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const exampleModules = import.meta.glob<string>('/examples/decks/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Your decks live in content/; with none there (e.g. a fresh clone), the bundled examples load instead.
const rawDeckModules = Object.keys(contentModules).length > 0 ? contentModules : exampleModules

function slugFromPath(path: string): string {
  return path
    .replace(/^\/(content|examples\/decks)\//, '')
    .replace(/\.md$/, '')
}

function parseDeckFile(raw: string, slug: string): AnyDeck {
  const meta = parseDeckMeta(raw)
  return meta.kind === 'flashcards' ? parseCardDeck(meta, slug) : parseQuizDeck(meta, slug)
}

let cachedDecks: AnyDeck[] | undefined

/** Every deck found under `content/` (or the examples), sorted by title, parsed once and cached for the session. */
export function loadDecks(): AnyDeck[] {
  cachedDecks ??= Object.entries(rawDeckModules)
    .map(([path, raw]) => parseDeckFile(raw, slugFromPath(path)))
    .sort((a, b) => a.title.localeCompare(b.title))
  return cachedDecks
}
