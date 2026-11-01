import { load } from 'js-yaml'
import type { AnyDeck, DeckInfo } from '../types'

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/**
 * Splits a leading `---`-delimited YAML frontmatter block off a markdown
 * string. Deliberately hand-rolled instead of using gray-matter, which
 * depends on Node's `Buffer` and breaks when bundled for the browser.
 */
function splitFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(FRONTMATTER_PATTERN)
  if (!match) return { data: {}, content: raw }

  const data = (load(match[1]) as Record<string, unknown> | undefined) ?? {}
  const content = raw.slice(match[0].length)
  return { data, content }
}

export interface DeckMeta extends Omit<DeckInfo, 'slug'> {
  /** `kind: flashcards` in frontmatter makes a card deck; anything else is a quiz. */
  kind: AnyDeck['kind']
  /** Raw frontmatter, for fields only one deck kind reads (e.g. `new_per_day`). */
  frontmatter: Record<string, unknown>
  /** The markdown after the frontmatter. */
  body: string
}

/** Reads a deck file's frontmatter: the metadata every deck kind shares, plus which kind it is. */
export function parseDeckMeta(raw: string): DeckMeta {
  const { data, content } = splitFrontmatter(raw)
  return {
    kind: data.kind === 'flashcards' ? 'flashcards' : 'quiz',
    title: typeof data.title === 'string' ? data.title : 'Untitled deck',
    cert: typeof data.cert === 'string' ? data.cert : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    frontmatter: data,
    body: content,
  }
}
