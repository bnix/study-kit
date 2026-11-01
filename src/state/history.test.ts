import { beforeEach, describe, expect, it } from 'vitest'
import { clearHistory, getDeckStats, getHistory, recordAttempt } from './history'

describe('history', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty history for a deck with no recorded attempts', () => {
    expect(getHistory('some-deck')).toEqual({})
  })

  it('records a first attempt', () => {
    recordAttempt('deck-a', 'q1', true)
    const history = getHistory('deck-a')

    expect(history.q1).toMatchObject({ attempts: 1, correct: 1, lastResult: true })
    expect(typeof history.q1.lastAttemptedAt).toBe('string')
  })

  it('accumulates attempts and correct counts across repeat sessions', () => {
    recordAttempt('deck-a', 'q1', true)
    recordAttempt('deck-a', 'q1', false)
    const history = getHistory('deck-a')

    expect(history.q1).toMatchObject({ attempts: 2, correct: 1, lastResult: false })
  })

  it('keeps history scoped per deck', () => {
    recordAttempt('deck-a', 'q1', true)
    recordAttempt('deck-b', 'q1', false)

    expect(getHistory('deck-a').q1).toMatchObject({ attempts: 1, correct: 1 })
    expect(getHistory('deck-b').q1).toMatchObject({ attempts: 1, correct: 0 })
  })

  it('tracks separate questions independently within a deck', () => {
    recordAttempt('deck-a', 'q1', true)
    recordAttempt('deck-a', 'q2', false)
    const history = getHistory('deck-a')

    expect(history.q1.correct).toBe(1)
    expect(history.q2.correct).toBe(0)
  })

  it('clears a deck history', () => {
    recordAttempt('deck-a', 'q1', true)
    clearHistory('deck-a')

    expect(getHistory('deck-a')).toEqual({})
  })

  it('computes deck stats from recorded attempts', () => {
    recordAttempt('deck-a', 'q1', true)
    recordAttempt('deck-a', 'q2', false)
    recordAttempt('deck-a', 'q2', true)

    expect(getDeckStats('deck-a', ['q1', 'q2', 'q3'])).toEqual({ total: 3, attempted: 2, mastered: 2 })
  })

  it('reports zeroed stats for a deck with no attempts', () => {
    expect(getDeckStats('deck-a', ['q1', 'q2'])).toEqual({ total: 2, attempted: 0, mastered: 0 })
  })
})
