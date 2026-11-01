import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyCard } from 'ts-fsrs'
import { parseDeckMeta } from '../content/frontmatter'
import { parseCardDeck } from '../content/parseCardDeck'
import { getCardStates, saveCardStates } from '../state/cardSchedule'
import { getHistory, recordAttempt } from '../state/history'
import { loadSession, saveSession } from '../state/session'
import type { Deck } from '../types'
import { CardDeckRow, QuizDeckRow } from './DeckRows'

const quizDeck: Deck = {
  slug: 'quiz',
  title: 'Quiz',
  tags: [],
  questions: [{ id: 'q1', prompt: 'Q1', options: [], multiSelect: false, references: [] }],
}

const cardDeck = parseCardDeck(parseDeckMeta('---\nkind: flashcards\n---\n\n### Front\n\nBack.\n'), 'cards')

describe('deck rows', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })
  afterEach(() => vi.restoreAllMocks())

  it('resets a quiz deck and re-reads its progress', () => {
    recordAttempt('quiz', 'q1', false)
    saveSession('quiz', { questionIndex: 0, selected: [], answered: false, results: [] })
    render(<QuizDeckRow deck={quizDeck} onStudy={() => {}} />)
    expect(screen.getByText(/0\/1 mastered/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(getHistory('quiz')).toEqual({})
    expect(loadSession('quiz')).toBeNull()
    expect(screen.queryByText(/mastered/)).not.toBeInTheDocument()
    expect(screen.queryByText(/in progress/)).not.toBeInTheDocument()
  })

  it('resets a card deck schedule and re-reads its progress', () => {
    const now = new Date()
    saveCardStates('cards', {
      [cardDeck.cards[0].id]: { card: createEmptyCard(now), introducedAt: now.toISOString() },
    })
    render(<CardDeckRow deck={cardDeck} onStudy={() => {}} />)
    expect(screen.getByText(/0\/1 learned/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(getCardStates('cards')).toEqual({})
    expect(screen.queryByText(/learned/)).not.toBeInTheDocument()
  })
})
