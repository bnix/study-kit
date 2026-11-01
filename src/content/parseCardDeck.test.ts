import { describe, expect, it } from 'vitest'
import { toString as mdastToString } from 'mdast-util-to-string'
import type { RootContent } from 'mdast'
import { parseDeckMeta } from './frontmatter'
import { parseCardDeck as parseCardDeckFile } from './parseCardDeck'

const parseCardDeck = (raw: string, slug: string) => parseCardDeckFile(parseDeckMeta(raw), slug)
const text = (nodes: RootContent[]) => nodes.map((n) => mdastToString(n)).join('\n')

describe('parseDeckMeta kind', () => {
  it('detects kind: flashcards in frontmatter, defaulting to quiz', () => {
    expect(parseDeckMeta('---\ntitle: A\nkind: flashcards\n---\n').kind).toBe('flashcards')
    expect(parseDeckMeta('---\ntitle: A\n---\n').kind).toBe('quiz')
    expect(parseDeckMeta('### No frontmatter').kind).toBe('quiz')
  })
})

describe('parseCardDeck', () => {
  it('parses frontmatter and heading-per-card structure', () => {
    const raw = `---
title: Bedrock Building Blocks
kind: flashcards
cert: AWS Certified GenAI Professional
tags: [bedrock]
---

### What does a Knowledge Base data source automate?

Chunking, **embedding**, and indexing.

- Sources include S3.

Learn more: [Ingesting data](https://example.com/ingest)

### What is a guardrail?

A policy that filters model inputs and outputs.
`
    const deck = parseCardDeck(raw, 'bedrock')

    expect(deck).toMatchObject({
      slug: 'bedrock',
      title: 'Bedrock Building Blocks',
      cert: 'AWS Certified GenAI Professional',
      tags: ['bedrock'],
      newPerDay: 20,
      warnings: [],
    })
    expect(deck.cards).toHaveLength(2)

    const [first] = deck.cards
    expect(first.frontText).toBe('What does a Knowledge Base data source automate?')
    expect(first.front).toHaveLength(1)
    expect(first.front[0].type).toBe('paragraph')
    expect(first.back.map((n) => n.type)).toEqual(['paragraph', 'list', 'paragraph'])
    expect(text(first.back)).toContain('Ingesting data')
  })

  it('moves content above a lone ? line onto the front', () => {
    const raw = `---
title: Policies
kind: flashcards
---

### What does this policy allow?

\`\`\`json
{ "Effect": "Allow", "Action": "bedrock:InvokeModel" }
\`\`\`

?

Invoking any Bedrock model.
`
    const [card] = parseCardDeck(raw, 'policies').cards

    expect(card.front.map((n) => n.type)).toEqual(['paragraph', 'code'])
    expect(text(card.back)).toBe('Invoking any Bedrock model.')
    expect(card.frontText).toContain('bedrock:InvokeModel')
  })

  it('gives cards with the same heading but different front content different IDs', () => {
    const raw = `---
title: Policies
kind: flashcards
---

### What does this allow?

\`allow-a\`

?

A.

### What does this allow?

\`allow-b\`

?

B.
`
    const deck = parseCardDeck(raw, 'policies')
    expect(deck.cards).toHaveLength(2)
    expect(deck.cards[0].id).not.toBe(deck.cards[1].id)
  })

  it('drops trailing thematic breaks used as card separators', () => {
    const raw = `---
title: A
kind: flashcards
---

### Front one

Back one.

---

### Front two

Back two.
`
    const [first] = parseCardDeck(raw, 'a').cards
    expect(first.back.map((n) => n.type)).toEqual(['paragraph'])
  })

  it('skips cards with no answer or a duplicate front, with warnings', () => {
    const raw = `---
title: A
kind: flashcards
---

### Empty card

### Repeated front

First.

### Repeated front

Second.
`
    const deck = parseCardDeck(raw, 'a')

    expect(deck.cards.map((c) => c.frontText)).toEqual(['Repeated front'])
    expect(text(deck.cards[0].back)).toBe('First.')
    expect(deck.warnings).toEqual([
      'Skipped "Empty card": no answer below the heading.',
      'Skipped duplicate card "Repeated front".',
    ])
  })

  it('reads new_per_day from frontmatter', () => {
    expect(parseCardDeck('---\ntitle: A\nkind: flashcards\nnew_per_day: 5\n---\n', 'a').newPerDay).toBe(5)
    expect(parseCardDeck('---\ntitle: A\nkind: flashcards\nnew_per_day: nope\n---\n', 'a').newPerDay).toBe(20)
  })
})
