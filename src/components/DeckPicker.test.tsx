import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CardDeck, QuizDeck } from '../types'
import { DeckPicker } from './DeckPicker'

const quiz = (title: string, cert?: string): QuizDeck => ({ kind: 'quiz', slug: title, title, cert, tags: [], questions: [] })
const cards = (title: string, cert?: string): CardDeck => ({
  kind: 'flashcards',
  slug: title,
  title,
  cert,
  tags: [],
  newPerDay: 20,
  cards: [],
  warnings: [],
})

describe('DeckPicker', () => {
  it('orders cert groups by their first quiz deck, then card-only certs, with Other for no cert', () => {
    // Already title-sorted, as loadDecks returns them: the card-only cert sorts first by title.
    const decks = [cards('A cards', 'Cards only'), quiz('B quiz', 'Both'), cards('C cards', 'Both'), quiz('D quiz')]
    render(<DeckPicker decks={decks} onStudyQuiz={() => {}} onStudyCards={() => {}} onViewMissedLog={() => {}} />)

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Both', 'Other', 'Cards only'])
  })
})
