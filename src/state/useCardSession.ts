import { useEffect, useMemo, useReducer } from 'react'
import { Rating, type Grade, type RecordLog } from 'ts-fsrs'
import type { CardDeck } from '../types'
import {
  buildCramQueue,
  buildReviewQueue,
  cardPhase,
  getCardStates,
  previewGrades,
  saveCardStates,
  type CardPhase,
  type CardRecord,
  type DeckCardStates,
} from './cardSchedule'

/** "review" studies what's due and updates the schedule; "cram" runs the whole deck and saves nothing. */
export type StudyMode = 'review' | 'cram'

/** A card rated Again comes back this many cards later in the same session. */
const REQUEUE_GAP = 3

export interface GradeResult {
  cardId: string
  rating: Grade
}

interface SessionSnapshot {
  queue: string[]
  position: number
  revealed: boolean
  states: DeckCardStates
  grades: GradeResult[]
}

interface SessionState extends SessionSnapshot {
  /** Snapshots from before each grade; undo pops one. */
  undoStack: SessionSnapshot[]
}

type SessionAction =
  | { type: 'reveal' }
  /** `record` is the card's new schedule, or null when grading shouldn't change it (cram). */
  | { type: 'grade'; cardId: string; rating: Grade; record: CardRecord | null }
  | { type: 'undo' }

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'reveal':
      return state.revealed ? state : { ...state, revealed: true }
    case 'grade': {
      if (!state.revealed) return state
      const { undoStack, ...snapshot } = state
      const queue = [...state.queue]
      if (action.rating === Rating.Again) {
        queue.splice(Math.min(state.position + 1 + REQUEUE_GAP, queue.length), 0, action.cardId)
      }
      return {
        queue,
        position: state.position + 1,
        revealed: false,
        states: action.record ? { ...state.states, [action.cardId]: action.record } : state.states,
        grades: [...state.grades, { cardId: action.cardId, rating: action.rating }],
        undoStack: [...undoStack, snapshot],
      }
    }
    case 'undo': {
      const previous = state.undoStack.at(-1)
      return previous ? { ...previous, undoStack: state.undoStack.slice(0, -1) } : state
    }
    default:
      return state
  }
}

function initialState(deck: CardDeck, mode: StudyMode): SessionState {
  const states = getCardStates(deck.slug)
  const queue = mode === 'review' ? buildReviewQueue(deck, states, new Date()) : buildCramQueue(deck)
  return { queue, position: 0, revealed: false, states, grades: [], undoStack: [] }
}

// The reducer owns the schedule; storage mirrors it. No save/resume of the session
// itself like the quiz has: reopening a deck rebuilds the queue from what's still due.
export function useCardSession(deck: CardDeck, mode: StudyMode) {
  const [state, dispatch] = useReducer(reducer, null, () => initialState(deck, mode))

  useEffect(() => {
    if (mode === 'review') saveCardStates(deck.slug, state.states)
  }, [deck.slug, mode, state.states])

  const currentCard = deck.cards.find((c) => c.id === state.queue[state.position])

  // Computed once at reveal so the interval labels match exactly what grading applies.
  const previews: RecordLog | null = useMemo(
    () => (state.revealed && currentCard ? previewGrades(state.states[currentCard.id], new Date()) : null),
    [state.revealed, currentCard, state.states],
  )

  const remaining = useMemo(() => {
    const counts: Record<CardPhase, number> = { new: 0, learning: 0, review: 0 }
    for (const id of state.queue.slice(state.position)) counts[cardPhase(state.states[id])] += 1
    return counts
  }, [state.queue, state.position, state.states])

  function grade(rating: Grade) {
    if (!currentCard || !previews) return
    const introducedAt = state.states[currentCard.id]?.introducedAt ?? new Date().toISOString()
    const record = mode === 'review' ? { card: previews[rating].card, introducedAt } : null
    dispatch({ type: 'grade', cardId: currentCard.id, rating, record })
  }

  return {
    currentCard,
    isComplete: state.position >= state.queue.length,
    revealed: state.revealed,
    previews,
    remaining,
    /** In-memory schedule; ahead of storage until the save effect runs, so read stats from here. */
    states: state.states,
    grades: state.grades,
    canUndo: state.undoStack.length > 0,
    reveal: () => dispatch({ type: 'reveal' }),
    grade,
    undo: () => dispatch({ type: 'undo' }),
  }
}

export type CardSession = ReturnType<typeof useCardSession>
