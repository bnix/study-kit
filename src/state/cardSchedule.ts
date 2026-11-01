import { createEmptyCard, fsrs, State, type Card, type RecordLog } from 'ts-fsrs'
import type { CardDeck } from '../types'
import { readJson, removeKey, writeJson } from './storage'

/**
 * Spaced-repetition state for flash cards, one storage entry per deck,
 * scheduled with FSRS (via ts-fsrs). A card with no record has never been
 * studied, i.e. it's "new".
 */
export interface CardRecord {
  card: Card
  /** When the card was first graded; caps how many new cards a day introduces. */
  introducedAt: string
}

export type DeckCardStates = Record<string, CardRecord>

const scheduler = fsrs({ enable_fuzz: true })

function storageKey(deckSlug: string): string {
  return `quizme:cards:${deckSlug}`
}

// JSON round-trips FSRS's Date fields as strings.
function reviveRecord({ card, introducedAt }: CardRecord): CardRecord {
  return {
    introducedAt,
    card: { ...card, due: new Date(card.due), last_review: card.last_review ? new Date(card.last_review) : undefined },
  }
}

export function getCardStates(deckSlug: string): DeckCardStates {
  const stored = readJson<DeckCardStates>(storageKey(deckSlug), {})
  return Object.fromEntries(Object.entries(stored).map(([id, record]) => [id, reviveRecord(record)]))
}

export function saveCardStates(deckSlug: string, states: DeckCardStates): void {
  writeJson(storageKey(deckSlug), states)
}

export function clearCardStates(deckSlug: string): void {
  removeKey(storageKey(deckSlug))
}

/** The resulting schedule for each possible grade of a card, as of `now`. */
export function previewGrades(record: CardRecord | undefined, now: Date): RecordLog {
  return scheduler.repeat(record?.card ?? createEmptyCard(now), now)
}

export type CardPhase = 'new' | 'learning' | 'review'

/** Never studied, still in short learning steps, or graduated to spaced review. */
export function cardPhase(record: CardRecord | undefined): CardPhase {
  if (!record) return 'new'
  return record.card.state === State.Review ? 'review' : 'learning'
}

function isDue(record: CardRecord | undefined, now: Date): boolean {
  return record !== undefined && record.card.due <= now
}

function newCardsLeftToday(deck: CardDeck, states: DeckCardStates, now: Date): number {
  const today = now.toDateString()
  const introducedToday = Object.values(states).filter((r) => new Date(r.introducedAt).toDateString() === today)
  return Math.max(0, deck.newPerDay - introducedToday.length)
}

export interface CardDeckStats {
  total: number
  /** Cards that have been graded at least once. */
  studied: number
  /** Cards graduated out of learning into spaced review. */
  learned: number
  due: number
  /** New cards a review session would introduce right now. */
  newToday: number
  /** Earliest upcoming due date among cards not yet due. */
  nextDueAt?: Date
}

export function getCardDeckStats(deck: CardDeck, states: DeckCardStates, now: Date): CardDeckStats {
  const records = deck.cards.map((c) => states[c.id])
  const studied = records.filter((r): r is CardRecord => r !== undefined)
  const upcoming = studied.filter((r) => !isDue(r, now)).map((r) => r.card.due)

  return {
    total: deck.cards.length,
    studied: studied.length,
    learned: studied.filter((r) => cardPhase(r) === 'review').length,
    due: records.filter((r) => isDue(r, now)).length,
    newToday: Math.min(deck.cards.length - studied.length, newCardsLeftToday(deck, states, now)),
    nextDueAt: upcoming.length > 0 ? new Date(Math.min(...upcoming.map((d) => d.getTime()))) : undefined,
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Card IDs for a review session: everything due, shuffled, then up to the day's
 * allowance of new cards. Due cards come first so a backlog clears before new
 * material piles onto it.
 */
export function buildReviewQueue(
  deck: CardDeck,
  states: DeckCardStates,
  now: Date,
  random: () => number = Math.random,
): string[] {
  const due = deck.cards.filter((c) => isDue(states[c.id], now)).map((c) => c.id)
  const unseen = deck.cards.filter((c) => cardPhase(states[c.id]) === 'new').map((c) => c.id)
  const newCards = shuffle(unseen, random).slice(0, newCardsLeftToday(deck, states, now))
  return [...shuffle(due, random), ...newCards]
}

/** Every card in the deck, shuffled, regardless of schedule. */
export function buildCramQueue(deck: CardDeck, random: () => number = Math.random): string[] {
  return shuffle(
    deck.cards.map((c) => c.id),
    random,
  )
}
