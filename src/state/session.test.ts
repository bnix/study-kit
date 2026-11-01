import { beforeEach, describe, expect, it } from 'vitest'
import { clearSession, loadSession, saveSession } from './session'

describe('session', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null for a deck with no saved session', () => {
    expect(loadSession('deck-a')).toBeNull()
  })

  it('round-trips a saved session', () => {
    saveSession('deck-a', {
      questionIndex: 1,
      selected: ['A'],
      answered: true,
      results: [{ questionId: 'q1', correct: true }],
    })

    expect(loadSession('deck-a')).toEqual({
      questionIndex: 1,
      selected: ['A'],
      answered: true,
      results: [{ questionId: 'q1', correct: true }],
    })
  })

  it('keeps sessions scoped per deck', () => {
    saveSession('deck-a', { questionIndex: 1, selected: [], answered: false, results: [] })
    saveSession('deck-b', { questionIndex: 2, selected: [], answered: false, results: [] })

    expect(loadSession('deck-a')?.questionIndex).toBe(1)
    expect(loadSession('deck-b')?.questionIndex).toBe(2)
  })

  it('clears a saved session', () => {
    saveSession('deck-a', { questionIndex: 1, selected: [], answered: false, results: [] })
    clearSession('deck-a')

    expect(loadSession('deck-a')).toBeNull()
  })
})
