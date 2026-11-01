import { beforeEach, describe, expect, it } from 'vitest'
import { Rating, State, type Grade } from 'ts-fsrs'
import type { CardDeck, Flashcard } from '../types'
import {
  buildCramQueue,
  buildReviewQueue,
  cardPhase,
  clearCardStates,
  getCardDeckStats,
  getCardStates,
  previewGrades,
  saveCardStates,
  type CardRecord,
} from './cardSchedule'

const NOW = new Date('2026-10-30T12:00:00')
const DAY = 24 * 60 * 60_000

function card(id: string): Flashcard {
  return { id, frontText: id, front: [], back: [] }
}

function deckOf(ids: string[], newPerDay = 20): CardDeck {
  return { slug: 'deck', title: 'Deck', tags: [], newPerDay, cards: ids.map(card), warnings: [] }
}

function gradedRecord(rating: Grade, at: Date, introducedAt = at): CardRecord {
  return { card: previewGrades(undefined, at)[rating].card, introducedAt: introducedAt.toISOString() }
}

describe('card schedule storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a deck through storage with dates revived', () => {
    const record = gradedRecord(Rating.Good, NOW)
    saveCardStates('deck', { a: record })

    const restored = getCardStates('deck').a
    expect(restored.card.due).toBeInstanceOf(Date)
    expect(restored.card.due.getTime()).toBe(record.card.due.getTime())
    expect(restored.card.last_review).toBeInstanceOf(Date)
  })

  it('clears a whole deck', () => {
    saveCardStates('deck', { a: gradedRecord(Rating.Good, NOW) })
    clearCardStates('deck')
    expect(getCardStates('deck')).toEqual({})
  })
})

describe('previewGrades and cardPhase', () => {
  it('schedules higher grades further out', () => {
    const preview = previewGrades(undefined, NOW)
    const due = (r: Grade) => preview[r].card.due.getTime()
    expect(due(Rating.Again)).toBeLessThan(due(Rating.Hard))
    expect(due(Rating.Hard)).toBeLessThanOrEqual(due(Rating.Good))
    expect(due(Rating.Good)).toBeLessThan(due(Rating.Easy))
    expect(preview[Rating.Easy].card.state).toBe(State.Review)
  })

  it('classifies new, learning, and review cards', () => {
    expect(cardPhase(undefined)).toBe('new')
    expect(cardPhase(gradedRecord(Rating.Good, NOW))).toBe('learning')
    expect(cardPhase(gradedRecord(Rating.Easy, NOW))).toBe('review')
  })
})

describe('buildReviewQueue and getCardDeckStats', () => {
  it('puts due cards before new cards and leaves not-yet-due cards out', () => {
    const deck = deckOf(['due', 'later', 'new1', 'new2'])
    const twoDaysAgo = new Date(NOW.getTime() - 2 * DAY)
    const states = { due: gradedRecord(Rating.Again, twoDaysAgo), later: gradedRecord(Rating.Easy, NOW) }

    const queue = buildReviewQueue(deck, states, NOW)
    expect(queue[0]).toBe('due')
    expect(new Set(queue.slice(1))).toEqual(new Set(['new1', 'new2']))

    const stats = getCardDeckStats(deck, states, NOW)
    expect(stats).toMatchObject({ total: 4, studied: 2, learned: 1, due: 1, newToday: 2 })
    expect(stats.nextDueAt?.getTime()).toBe(states.later.card.due.getTime())
  })

  it('caps new cards by what was already introduced today', () => {
    const deck = deckOf(['seen', 'n1', 'n2', 'n3'], 2)
    const states = { seen: gradedRecord(Rating.Easy, NOW) }

    expect(buildReviewQueue(deck, states, NOW)).toHaveLength(1)
    expect(getCardDeckStats(deck, states, NOW).newToday).toBe(1)

    // A new day restores the full allowance.
    const tomorrow = new Date(NOW.getTime() + DAY)
    expect(buildReviewQueue(deck, states, tomorrow).filter((id) => id !== 'seen')).toHaveLength(2)
  })

  it('builds a cram queue of every card', () => {
    expect(new Set(buildCramQueue(deckOf(['a', 'b', 'c'])))).toEqual(new Set(['a', 'b', 'c']))
  })
})
