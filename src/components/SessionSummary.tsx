import { useState } from 'react'
import type { useQuizSession } from '../state/useQuizSession'

interface SessionSummaryProps {
  session: ReturnType<typeof useQuizSession>
  onRestart: () => void
  onExit: () => void
}

export function SessionSummary({ session, onRestart, onExit }: SessionSummaryProps) {
  const { score, totalQuestions, results } = session
  const missed = results.filter((r) => !r.correct)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="session-summary">
      <h1>
        Score: {score} / {totalQuestions}
      </h1>

      {missed.length > 0 ? (
        <>
          <h2>Review missed questions</h2>
          <ul className="missed-list">
            {missed.map(({ question }) => {
              const expanded = expandedId === question.id
              return (
                <li key={question.id}>
                  <button className="link-button" onClick={() => setExpandedId(expanded ? null : question.id)}>
                    {question.prompt}
                  </button>
                  {expanded && (
                    <div className="review-detail">
                      <ul className="options">
                        {question.options.map((option) => (
                          <li key={option.id} className={option.correct ? 'correct' : ''}>
                            {option.id}. {option.text}
                          </li>
                        ))}
                      </ul>
                      {question.explanation && <p className="explanation">{question.explanation}</p>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <p>Perfect score — no missed questions.</p>
      )}

      <div className="summary-actions">
        <button onClick={onRestart}>Retake this deck</button>
        <button className="link-button" onClick={onExit}>
          Back to decks
        </button>
      </div>
    </div>
  )
}
