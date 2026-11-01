import { useEffect, useMemo, useReducer } from 'react'
import type { Deck, Question } from '../types'
import { recordAttempt } from './history'
import { clearSession, loadSession, saveSession, type PersistedResult } from './session'

interface QuestionResult {
  question: Question
  correct: boolean
}

interface SessionState {
  questionIndex: number
  selected: string[]
  answered: boolean
  results: PersistedResult[]
}

type SessionAction =
  | { type: 'toggle'; optionId: string; multiSelect: boolean }
  | { type: 'submit'; questionId: string; correct: boolean }
  | { type: 'next' }

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'toggle': {
      if (state.answered) return state
      const isSelected = state.selected.includes(action.optionId)
      if (action.multiSelect) {
        return {
          ...state,
          selected: isSelected
            ? state.selected.filter((id) => id !== action.optionId)
            : [...state.selected, action.optionId],
        }
      }
      return { ...state, selected: isSelected ? [] : [action.optionId] }
    }
    case 'submit':
      if (state.answered) return state
      return {
        ...state,
        answered: true,
        results: [...state.results, { questionId: action.questionId, correct: action.correct }],
      }
    case 'next':
      return { ...state, questionIndex: state.questionIndex + 1, selected: [], answered: false }
    default:
      return state
  }
}

const emptyState: SessionState = { questionIndex: 0, selected: [], answered: false, results: [] }

function restoreState(deck: Deck): SessionState {
  const persisted = loadSession(deck.slug)
  if (!persisted) return emptyState

  const questionIds = new Set(deck.questions.map((q) => q.id))
  const isValid =
    Number.isInteger(persisted.questionIndex) &&
    persisted.questionIndex >= 0 &&
    persisted.questionIndex <= deck.questions.length &&
    Array.isArray(persisted.selected) &&
    Array.isArray(persisted.results) &&
    persisted.results.every((r) => questionIds.has(r.questionId))

  if (!isValid) return emptyState

  // A question that was already answered (feedback pending "Next") shouldn't be
  // re-shown on resume — skip straight to the first question with no answer yet.
  if (persisted.answered) {
    return {
      questionIndex: persisted.questionIndex + 1,
      selected: [],
      answered: false,
      results: persisted.results,
    }
  }

  return {
    questionIndex: persisted.questionIndex,
    selected: persisted.selected,
    answered: persisted.answered,
    results: persisted.results,
  }
}

export function useQuizSession(deck: Deck) {
  const [state, dispatch] = useReducer(reducer, deck, restoreState)

  const isComplete = state.questionIndex >= deck.questions.length

  useEffect(() => {
    if (isComplete) {
      clearSession(deck.slug)
    } else {
      saveSession(deck.slug, state)
    }
  }, [deck.slug, isComplete, state])

  const currentQuestion = deck.questions[state.questionIndex]

  const isCorrect = useMemo(() => {
    if (!currentQuestion) return false
    const correctIds = currentQuestion.options.filter((o) => o.correct).map((o) => o.id).sort()
    const selectedIds = [...state.selected].sort()
    return (
      correctIds.length === selectedIds.length && correctIds.every((id, i) => id === selectedIds[i])
    )
  }, [currentQuestion, state.selected])

  function toggleOption(optionId: string) {
    if (!currentQuestion) return
    dispatch({ type: 'toggle', optionId, multiSelect: currentQuestion.multiSelect })
  }

  function submit() {
    if (!currentQuestion || state.selected.length === 0) return
    recordAttempt(deck.slug, currentQuestion.id, isCorrect)
    dispatch({ type: 'submit', questionId: currentQuestion.id, correct: isCorrect })
  }

  function next() {
    dispatch({ type: 'next' })
  }

  const score = state.results.filter((r) => r.correct).length

  const results: QuestionResult[] = useMemo(
    () =>
      state.results.map((r) => ({
        question: deck.questions.find((q) => q.id === r.questionId)!,
        correct: r.correct,
      })),
    [deck.questions, state.results],
  )

  return {
    currentQuestion,
    questionNumber: state.questionIndex + 1,
    totalQuestions: deck.questions.length,
    selected: state.selected,
    answered: state.answered,
    isCorrect,
    isComplete,
    results,
    score,
    toggleOption,
    submit,
    next,
  }
}
