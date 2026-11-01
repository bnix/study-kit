import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { State } from 'ts-fsrs'
import { parseDeckMeta } from './content/frontmatter'
import { parseCardDeck } from './content/parseCardDeck'
import { getCardStates } from './state/cardSchedule'
import { useCardSession, type StudyMode } from './state/useCardSession'
import { CardStudyView } from './components/CardStudyView'
import { CardSessionSummary } from './components/CardSessionSummary'

const deck = parseCardDeck(
  parseDeckMeta(`---
title: Test Cards
kind: flashcards
---

### Front one

Back **one**.

### Front two

Back two.
`),
  'test-cards',
)

function Harness({ mode = 'review' }: { mode?: StudyMode }) {
  const session = useCardSession(deck, mode)
  return session.isComplete ? (
    <CardSessionSummary session={session} onRestart={() => {}} onStudyAll={() => {}} onExit={() => {}} />
  ) : (
    <CardStudyView session={session} onExit={() => {}} />
  )
}

const currentFront = () => screen.getByText(/^Front (one|two)$/).textContent!
const backFor = (front: string) => (front === 'Front one' ? /Back\s*one/ : /Back two/)
const press = (key: string) => fireEvent.keyDown(window, { key })

describe('flash card session flow', () => {
  beforeEach(() => localStorage.clear())

  it('hides the answer until revealed, then requeues a card rated Again', () => {
    render(<Harness />)
    expect(screen.getByTestId('card-counts')).toHaveTextContent('2 new')

    const first = currentFront()
    expect(document.querySelector('.card-back')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /show answer/i }))
    expect(document.querySelector('.card-back')).toHaveTextContent(backFor(first))
    fireEvent.click(screen.getByRole('button', { name: /again/i }))

    // Rated Again: comes back after the other card.
    const second = currentFront()
    expect(second).not.toBe(first)
    press(' ')
    press('3')
    expect(currentFront()).toBe(first)
    expect(screen.getByTestId('card-counts')).toHaveTextContent('0 new')
    expect(screen.getByTestId('card-counts')).toHaveTextContent('1 learning')

    press(' ')
    press('4')

    expect(screen.getByRole('heading', { name: /review complete/i })).toBeInTheDocument()
    expect(screen.getByText(/2 cards studied · 1 rated Again/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: first }))
    expect(document.querySelector('.review-detail')).toHaveTextContent(backFor(first))

    const states = getCardStates('test-cards')
    expect(Object.keys(states)).toHaveLength(2)
    const firstId = deck.cards.find((c) => c.frontText === first)!.id
    expect(states[firstId].card.state).toBe(State.Review)
  })

  it('undo restores the previous card and its stored schedule', () => {
    render(<Harness />)
    const first = currentFront()
    press(' ')
    press('3')
    expect(Object.keys(getCardStates('test-cards'))).toHaveLength(1)

    press('u')
    expect(currentFront()).toBe(first)
    expect(screen.getByRole('group', { name: /recall/i })).toBeInTheDocument()
    expect(getCardStates('test-cards')).toEqual({})
  })

  it('cram mode runs every card without saving a schedule', () => {
    render(<Harness mode="cram" />)
    expect(screen.getByTestId('card-counts')).toHaveTextContent('2 left · not saved')
    press(' ')
    press('3')
    press(' ')
    press('3')

    expect(screen.getByRole('heading', { name: /deck run complete/i })).toBeInTheDocument()
    expect(getCardStates('test-cards')).toEqual({})
  })

  it('shows an all-caught-up summary when nothing is due', () => {
    const { unmount } = render(<Harness />)
    press(' ')
    press('4')
    press(' ')
    press('4')
    unmount()

    render(<Harness />)
    expect(screen.getByRole('heading', { name: /all caught up/i })).toBeInTheDocument()
    expect(screen.getByText(/next card due in \d+d/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /keep reviewing/i })).not.toBeInTheDocument()
  })
})
