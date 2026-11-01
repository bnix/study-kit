import { describe, expect, it } from 'vitest'
import { loadDecks } from './loadDecks'

// Runs against your content/ decks (or the bundled examples), so assert properties every valid
// vault has rather than specific deck names that change as notes evolve.
describe('loadDecks (content/ decks, or examples when none)', () => {
  it('discovers and parses at least one deck', () => {
    expect(loadDecks().length).toBeGreaterThan(0)
  })

  it('gives every deck a unique slug and at least one question or card', () => {
    const decks = loadDecks()
    expect(new Set(decks.map((d) => d.slug)).size).toBe(decks.length)
    for (const deck of decks) {
      const items = deck.kind === 'quiz' ? deck.questions : deck.cards
      expect(items.length, deck.slug).toBeGreaterThan(0)
    }
  })

  it('returns decks sorted by title', () => {
    const titles = loadDecks().map((d) => d.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)))
  })
})
