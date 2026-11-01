import type { Deck, MissedAnswer, MissedQuestionRecord, Question } from '../types'
import { getHistory } from './history'
import { hasKey, readJson, storageKey, writeJson } from './storage'

/**
 * Permanent log of every question ever answered wrong, across all decks. Unlike
 * per-deck history it is never cleared by "Reset", and each record snapshots the
 * full question so it can be exported (e.g. as LLM context for generating related
 * questions) even if the deck file later changes or disappears.
 */
const STORAGE_KEY = storageKey('missed-log')
const BACKFILL_KEY = storageKey('missed-log:backfilled')

type MissLog = Record<string, MissedQuestionRecord>

function recordKey(deckSlug: string, questionId: string): string {
  return `${deckSlug}:${questionId}`
}

function loadLog(): MissLog {
  return readJson<MissLog>(STORAGE_KEY, {})
}

function saveLog(log: MissLog): void {
  writeJson(STORAGE_KEY, log)
}

type QuestionSnapshot = Pick<
  MissedQuestionRecord,
  'deckSlug' | 'deckTitle' | 'cert' | 'questionId' | 'prompt' | 'multiSelect' | 'options' | 'explanation' | 'references'
>

/** The full question as it reads now, so the log survives the deck file changing or disappearing. */
function snapshotQuestion(deck: Deck, question: Question): QuestionSnapshot {
  return {
    deckSlug: deck.slug,
    deckTitle: deck.title,
    cert: deck.cert,
    questionId: question.id,
    prompt: question.prompt,
    multiSelect: question.multiSelect,
    options: question.options,
    explanation: question.explanation,
    references: question.references,
  }
}

export function recordMiss(deck: Deck, question: Question, selectedIds: string[]): MissedQuestionRecord {
  const log = loadLog()
  const key = recordKey(deck.slug, question.id)
  const previous = log[key]
  const now = new Date().toISOString()

  const answer: MissedAnswer = {
    at: now,
    selected: question.options.filter((o) => selectedIds.includes(o.id)).map((o) => o.text),
  }

  // Refresh the question snapshot on every miss so the log reflects the latest deck wording.
  const record: MissedQuestionRecord = {
    ...snapshotQuestion(deck, question),
    missCount: (previous?.missCount ?? 0) + 1,
    firstMissedAt: previous?.firstMissedAt ?? now,
    lastMissedAt: now,
    answers: [...(previous?.answers ?? []), answer],
    backfilled: previous?.backfilled,
  }

  saveLog({ ...log, [key]: record })
  return record
}

/**
 * One-time import of misses from per-deck history, which predates the log. History
 * only has counts, so these records carry no answers and use the last attempt date
 * as the miss date. Questions no longer in any deck can't be rebuilt and are skipped.
 */
export function backfillFromHistory(decks: Deck[]): void {
  if (hasKey(BACKFILL_KEY)) return

  const log = loadLog()
  for (const deck of decks) {
    const history = getHistory(deck.slug)
    for (const question of deck.questions) {
      const attempt = history[question.id]
      const historyMisses = attempt ? attempt.attempts - attempt.correct : 0
      if (historyMisses <= 0) continue

      const key = recordKey(deck.slug, question.id)
      const existing = log[key]
      if (existing) {
        // History counts include misses already logged, so take the larger total.
        if (historyMisses > existing.missCount) {
          existing.missCount = historyMisses
          existing.backfilled = true
        }
        continue
      }

      log[key] = {
        ...snapshotQuestion(deck, question),
        missCount: historyMisses,
        firstMissedAt: attempt.lastAttemptedAt,
        lastMissedAt: attempt.lastAttemptedAt,
        answers: [],
        backfilled: true,
      }
    }
  }

  saveLog(log)
  // If this write is dropped, the next load re-runs the backfill, which is harmless since it only fills gaps.
  writeJson(BACKFILL_KEY, new Date().toISOString())
}

/** All logged misses, most recently missed first. */
export function getMissLog(): MissedQuestionRecord[] {
  return Object.values(loadLog()).sort((a, b) => b.lastMissedAt.localeCompare(a.lastMissedAt))
}

export function missLogToJson(records: MissedQuestionRecord[]): string {
  return JSON.stringify(records, null, 2)
}

export function missLogToMarkdown(records: MissedQuestionRecord[]): string {
  const sections = records.map((r) => {
    const lines = [
      `## ${r.prompt.split('\n')[0]}`,
      '',
      `- Deck: ${r.cert ? `${r.cert} / ` : ''}${r.deckTitle}`,
      `- Missed ${r.missCount} time${r.missCount === 1 ? '' : 's'} (last ${r.backfilled && r.answers.length === 0 ? 'attempted ' : ''}${r.lastMissedAt})`,
      '',
    ]
    if (r.prompt.includes('\n')) lines.push(r.prompt, '')
    if (r.multiSelect) lines.push('_Select all that apply._', '')
    for (const option of r.options) lines.push(`- [${option.correct ? 'x' : ' '}] ${option.text}`)
    lines.push('')
    lines.push('Wrong answers given:')
    for (const answer of r.answers) lines.push(`- ${answer.selected.join('; ') || '(none)'}`)
    if (r.backfilled) lines.push('- (earlier answers not recorded)')
    if (r.explanation) lines.push('', `> ${r.explanation.replace(/\n/g, '\n> ')}`)
    if (r.references.length > 0) {
      lines.push('', 'References:')
      for (const ref of r.references) lines.push(`- [${ref.text}](${ref.url})`)
    }
    return lines.join('\n')
  })

  return [`# Missed questions (${records.length})`, '', ...sections].join('\n\n') + '\n'
}
