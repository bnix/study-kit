import { describe, expect, it } from 'vitest'
import { loadDecks } from './loadDecks'

describe('loadDecks (real content via the content/ symlink)', () => {
  it('discovers decks from the curated vault folder and parses their questions', () => {
    const decks = loadDecks()

    expect(decks.length).toBeGreaterThanOrEqual(2)

    const bedrock = decks.find((d) => d.slug === 'genai-professional/bedrock-data-ingestion')
    expect(bedrock).toBeDefined()
    expect(bedrock?.cert).toBe('AWS Certified GenAI Professional')
    expect(bedrock?.questions.length).toBeGreaterThan(0)
    expect(bedrock?.questions.some((q) => q.multiSelect)).toBe(true)
  })
})
