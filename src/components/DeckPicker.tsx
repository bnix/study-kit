import { useState } from 'react'
import type { Deck } from '../types'
import { clearHistory, getDeckStats } from '../state/history'
import { clearSession, loadSession } from '../state/session'

interface DeckPickerProps {
  decks: Deck[]
  onSelect: (deck: Deck) => void
}

export function DeckPicker({ decks, onSelect }: DeckPickerProps) {
  const [, forceRefresh] = useState(0)

  function resetProgress(deck: Deck) {
    if (!window.confirm(`Reset all saved progress for "${deck.title}"? This can't be undone.`)) return
    clearHistory(deck.slug)
    clearSession(deck.slug)
    forceRefresh((n) => n + 1)
  }

  if (decks.length === 0) {
    return (
      <div className="deck-picker">
        <p>
          No decks found under <code>content/</code>. Add a deck markdown file to your curated vault
          folder and reload.
        </p>
      </div>
    )
  }

  const groups = new Map<string, Deck[]>()
  for (const deck of decks) {
    const key = deck.cert ?? 'Other'
    groups.set(key, [...(groups.get(key) ?? []), deck])
  }

  return (
    <div className="deck-picker">
      <h1>Quiz Me</h1>
      {[...groups.entries()].map(([cert, certDecks]) => (
        <section key={cert}>
          <h2>{cert}</h2>
          <ul>
            {certDecks.map((deck) => {
              const questionIds = deck.questions.map((q) => q.id)
              const stats = getDeckStats(deck.slug, questionIds)
              const inProgress = loadSession(deck.slug) !== null

              return (
                <li key={deck.slug} className="deck-row">
                  <button onClick={() => onSelect(deck)}>
                    {deck.title}
                    <span className="deck-meta"> · {deck.questions.length} questions</span>
                    {stats.attempted > 0 && (
                      <span className="deck-progress">
                        {' '}
                        · {stats.mastered}/{stats.total} mastered
                      </span>
                    )}
                    {inProgress && <span className="deck-progress"> · in progress</span>}
                  </button>
                  {stats.attempted > 0 && (
                    <button className="link-button reset-progress" onClick={() => resetProgress(deck)}>
                      Reset progress
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
