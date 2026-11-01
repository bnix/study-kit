import { beforeEach, describe, expect, it } from 'vitest'
import type { Deck } from '../types'
import { clearHistory, recordAttempt } from './history'
import { backfillFromHistory, getMissLog, missLogToJson, missLogToMarkdown, recordMiss } from './missLog'

const deck: Deck = {
  slug: 'deck-a',
  title: 'Deck A',
  cert: 'Cert X',
  tags: [],
  questions: [
    {
      id: 'q1',
      prompt: 'Pick the even numbers.',
      multiSelect: true,
      options: [
        { id: 'A', text: '2', correct: true },
        { id: 'B', text: '3', correct: false },
        { id: 'C', text: '4', correct: true },
      ],
      explanation: 'Even numbers divide by 2.',
      references: [{ text: 'Parity', url: 'https://example.com/parity' }],
    },
  ],
}
const [q1] = deck.questions

describe('missLog', () => {
  beforeEach(() => localStorage.clear())

  it('snapshots the question and the wrong answer given', () => {
    recordMiss(deck, q1, ['A', 'B'])
    const [record] = getMissLog()

    expect(record).toMatchObject({
      deckSlug: 'deck-a',
      deckTitle: 'Deck A',
      prompt: 'Pick the even numbers.',
      missCount: 1,
      options: q1.options,
    })
    expect(record.answers).toEqual([{ at: record.lastMissedAt, selected: ['2', '3'] }])
  })

  it('accumulates repeat misses on one record', () => {
    recordMiss(deck, q1, ['B'])
    recordMiss(deck, q1, ['A'])
    const log = getMissLog()

    expect(log).toHaveLength(1)
    expect(log[0].missCount).toBe(2)
    expect(log[0].answers.map((a) => a.selected)).toEqual([['3'], ['2']])
  })

  it('survives resetting deck progress', () => {
    recordMiss(deck, q1, ['B'])
    clearHistory('deck-a')

    expect(getMissLog()).toHaveLength(1)
  })

  it('exports markdown with correct options, wrong answers, and references', () => {
    recordMiss(deck, q1, ['B'])
    const md = missLogToMarkdown(getMissLog())

    expect(md).toContain('## Pick the even numbers.')
    expect(md).toContain('- Deck: Cert X / Deck A')
    expect(md).toContain('- [x] 2\n- [ ] 3\n- [x] 4')
    expect(md).toContain('Wrong answers given:\n- 3')
    expect(md).toContain('> Even numbers divide by 2.')
    expect(md).toContain('- [Parity](https://example.com/parity)')
  })

  it('exports JSON that round-trips', () => {
    recordMiss(deck, q1, ['B'])
    const log = getMissLog()

    expect(JSON.parse(missLogToJson(log))).toEqual(log)
  })

  describe('backfillFromHistory', () => {
    const q2 = { ...q1, id: 'q2', prompt: 'Never missed.' }
    const twoQuestionDeck: Deck = { ...deck, questions: [q1, q2] }

    it('imports every question ever missed, even if since answered correctly', () => {
      recordAttempt('deck-a', 'q1', false)
      recordAttempt('deck-a', 'q1', false)
      recordAttempt('deck-a', 'q1', true)
      recordAttempt('deck-a', 'q2', true)
      backfillFromHistory([twoQuestionDeck])
      const log = getMissLog()

      expect(log).toHaveLength(1)
      expect(log[0]).toMatchObject({ questionId: 'q1', missCount: 2, answers: [], backfilled: true })
      expect(log[0].options).toEqual(q1.options)
      expect(missLogToMarkdown(log)).toContain('- (earlier answers not recorded)')
    })

    it('runs only once', () => {
      recordAttempt('deck-a', 'q1', false)
      backfillFromHistory([deck])
      recordAttempt('deck-a', 'q1', false)
      backfillFromHistory([deck])

      expect(getMissLog()[0].missCount).toBe(1)
    })

    it('tops up a record already in the log without losing its answers', () => {
      recordAttempt('deck-a', 'q1', false)
      recordAttempt('deck-a', 'q1', false)
      recordMiss(deck, q1, ['B'])
      backfillFromHistory([deck])
      recordMiss(deck, q1, ['A'])
      const [record] = getMissLog()

      expect(record.missCount).toBe(3)
      expect(record.backfilled).toBe(true)
      expect(record.answers.map((a) => a.selected)).toEqual([['3'], ['2']])
    })
  })
})
