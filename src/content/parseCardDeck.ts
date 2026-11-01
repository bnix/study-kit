import { toString as mdastToString } from 'mdast-util-to-string'
import type { RootContent } from 'mdast'
import type { CardDeck, Flashcard } from '../types'
import type { DeckMeta } from './frontmatter'
import { hashText } from './hash'
import { splitSections, type Section } from './sections'

const DEFAULT_NEW_PER_DAY = 20

// `?` alone on its own line (blank lines around it) ends the front. Not `---`: a
// line of text directly above `---` parses as a setext heading instead of a break.
function isFrontSeparator(node: RootContent): boolean {
  return node.type === 'paragraph' && mdastToString(node).trim() === '?'
}

function buildCard({ heading, body }: Section): Flashcard {
  const separatorIndex = body.findIndex(isFrontSeparator)
  const extraFront = separatorIndex === -1 ? [] : body.slice(0, separatorIndex)
  const back = separatorIndex === -1 ? [...body] : body.slice(separatorIndex + 1)

  // Authors often put `---` between cards for readability in their editor; it isn't part of the answer.
  while (back.at(-1)?.type === 'thematicBreak') back.pop()

  const frontText = [mdastToString(heading), ...extraFront.map((node) => mdastToString(node))]
    .filter(Boolean)
    .join('\n\n')

  return {
    id: hashText(frontText),
    frontText,
    front: [{ type: 'paragraph', children: heading.children }, ...extraFront],
    back,
  }
}

/** Builds a `CardDeck` from a parsed `kind: flashcards` file. See the deck-format skill for the format spec. */
export function parseCardDeck({ title, cert, tags, frontmatter, body }: DeckMeta, slug: string): CardDeck {
  const { new_per_day: newPerDay } = frontmatter
  const cards: Flashcard[] = []
  const warnings: string[] = []

  for (const card of splitSections(body).map(buildCard)) {
    if (card.back.length === 0) {
      warnings.push(`Skipped "${card.frontText}": no answer below the heading.`)
    } else if (cards.some((c) => c.id === card.id)) {
      // Same front means same ID, so the two would share one review schedule.
      warnings.push(`Skipped duplicate card "${card.frontText}".`)
    } else {
      cards.push(card)
    }
  }

  return {
    kind: 'flashcards',
    slug,
    title,
    cert,
    tags,
    newPerDay: typeof newPerDay === 'number' && newPerDay >= 0 ? Math.floor(newPerDay) : DEFAULT_NEW_PER_DAY,
    cards,
    warnings,
  }
}
