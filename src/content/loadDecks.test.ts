import { describe, expect, it } from 'vitest'
import { loadCardDecks, loadDecks } from './loadDecks'

// Runs against the real content/ symlink, so assert properties every valid
// vault has rather than specific deck names that change as notes evolve.
describe('loadDecks (real content via the content/ symlink)', () => {
  it('discovers and parses at least one deck', () => {
    expect(loadDecks().length + loadCardDecks().length).toBeGreaterThan(0)
  })

  it('gives every deck a unique slug and at least one question or card', () => {
    const decks = [...loadDecks(), ...loadCardDecks()]
    expect(new Set(decks.map((d) => d.slug)).size).toBe(decks.length)
    for (const deck of loadDecks()) expect(deck.questions.length, deck.slug).toBeGreaterThan(0)
    for (const deck of loadCardDecks()) expect(deck.cards.length, deck.slug).toBeGreaterThan(0)
  })

  it('routes kind: flashcards files to card decks only', () => {
    const quizSlugs = new Set(loadDecks().map((d) => d.slug))
    for (const deck of loadCardDecks()) expect(quizSlugs.has(deck.slug)).toBe(false)
  })
})
