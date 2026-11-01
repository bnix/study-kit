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
