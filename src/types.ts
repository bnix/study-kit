export interface Option {
  id: string
  text: string
  correct: boolean
}

export interface Reference {
  text: string
  url: string
}

export interface Question {
  id: string
  prompt: string
  options: Option[]
  multiSelect: boolean
  explanation?: string
  references: Reference[]
}

export interface Deck {
  slug: string
  title: string
  cert?: string
  tags: string[]
  questions: Question[]
}

export interface AttemptRecord {
  attempts: number
  correct: number
  lastResult: boolean
  lastAttemptedAt: string
}

export type DeckHistory = Record<string, AttemptRecord>

export interface MissedAnswer {
  at: string
  /** Text of the options selected on that attempt. */
  selected: string[]
}

export interface MissedQuestionRecord {
  deckSlug: string
  deckTitle: string
  cert?: string
  questionId: string
  prompt: string
  multiSelect: boolean
  options: Option[]
  explanation?: string
  references: Reference[]
  missCount: number
  firstMissedAt: string
  lastMissedAt: string
  answers: MissedAnswer[]
  /** Rebuilt from per-deck history: answers given and exact miss dates weren't recorded. */
  backfilled?: boolean
}
