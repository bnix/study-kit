import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { getHistory } from './state/history'
import { useQuizSession } from './state/useQuizSession'
import { QuizView } from './components/QuizView'
import { SessionSummary } from './components/SessionSummary'
import type { Deck } from './types'

const deck: Deck = {
  slug: 'test-deck',
  title: 'Test Deck',
  cert: 'Test Cert',
  tags: [],
  questions: [
    {
      id: 'q1',
      prompt: 'What is 2 + 2?',
      multiSelect: false,
      options: [
        { id: 'A', text: '3', correct: false },
        { id: 'B', text: '4', correct: true },
      ],
      explanation: 'Basic arithmetic.',
      references: [],
    },
    {
      id: 'q2',
      prompt: 'Select the even numbers.',
      multiSelect: true,
      options: [
        { id: 'A', text: '2', correct: true },
        { id: 'B', text: '3', correct: false },
        { id: 'C', text: '4', correct: true },
      ],
      references: [],
    },
  ],
}

function Harness({ onRestart }: { onRestart: () => void }) {
  const session = useQuizSession(deck)
  return session.isComplete ? (
    <SessionSummary session={session} onRestart={onRestart} onExit={() => {}} />
  ) : (
    <QuizView session={session} onExit={() => {}} />
  )
}

describe('quiz session flow', () => {
  beforeEach(() => localStorage.clear())

  it('walks a full session through to a score summary with a missed-question review', () => {
    const { unmount } = render(<Harness onRestart={() => {}} />)

    // Q1: answer correctly (single-select).
    expect(screen.getByTestId('quiz-counter')).toHaveAttribute('data-question', '1')
    fireEvent.click(screen.getByLabelText(/4$/))
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText(/correct!/i)).toBeInTheDocument()
    expect(screen.getByText(/basic arithmetic/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))

    // Q2: select only one of the two correct options (multi-select) -> incorrect.
    expect(screen.getByTestId('quiz-counter')).toHaveAttribute('data-question', '2')
    fireEvent.click(screen.getByLabelText(/2$/))
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /see results/i }))

    // Summary screen.
    expect(screen.getByText(/score: 1 \/ 2/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/select the even numbers/i))
    expect(screen.getByText(/A\. 2/)).toBeInTheDocument()
    expect(screen.getByText(/C\. 4/)).toBeInTheDocument()

    // History persisted to localStorage per question.
    const history = getHistory('test-deck')
    expect(history.q1).toMatchObject({ attempts: 1, correct: 1 })
    expect(history.q2).toMatchObject({ attempts: 1, correct: 0 })

    // Session cleared once the deck is complete, so a fresh mount starts over.
    unmount()
    render(<Harness onRestart={() => {}} />)
    expect(screen.getByTestId('quiz-counter')).toHaveAttribute('data-question', '1')
  })

  it('resumes an in-progress session after remounting mid-deck', () => {
    const { unmount } = render(<Harness onRestart={() => {}} />)

    fireEvent.click(screen.getByLabelText(/4$/))
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    expect(screen.getByTestId('quiz-counter')).toHaveAttribute('data-question', '2')
    unmount()

    // A fresh mount (e.g. after a page reload) should pick up where we left off.
    render(<Harness onRestart={() => {}} />)
    expect(screen.getByTestId('quiz-counter')).toHaveAttribute('data-question', '2')
  })

  it('skips past an answered question left on the feedback screen when resumed', () => {
    const { unmount } = render(<Harness onRestart={() => {}} />)

    // Answer Q1 but close out before clicking "Next question".
    fireEvent.click(screen.getByLabelText(/4$/))
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText(/correct!/i)).toBeInTheDocument()
    unmount()

    // Resuming should land fresh on Q2, not re-show Q1's feedback.
    render(<Harness onRestart={() => {}} />)
    expect(screen.getByTestId('quiz-counter')).toHaveAttribute('data-question', '2')
    expect(screen.queryByText(/correct!/i)).not.toBeInTheDocument()
  })
})
