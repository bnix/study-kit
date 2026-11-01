import type { QuizSession } from '../state/useQuizSession'
import { ExpandableList } from './ExpandableList'
import { QuestionReview } from './QuestionReview'

interface SessionSummaryProps {
  session: QuizSession
  onRestart: () => void
  onExit: () => void
}

export function SessionSummary({ session, onRestart, onExit }: SessionSummaryProps) {
  const { mode, score, totalQuestions, results } = session
  const missed = results.filter((r) => !r.correct)

  return (
    <div className="session-summary">
      <h1>
        Score: {score} / {totalQuestions}
      </h1>

      {missed.length > 0 ? (
        <>
          <h2>Review missed questions</h2>
          <ExpandableList
            items={missed.map((r) => r.question)}
            itemKey={(q) => q.id}
            label={(q) => q.prompt}
            detail={(q) => <QuestionReview options={q.options} explanation={q.explanation} />}
          />
        </>
      ) : (
        <p>Perfect score — no missed questions.</p>
      )}

      <div className="summary-actions">
        {mode === 'missed' ? (
          missed.length > 0 && <button className="primary" onClick={onRestart}>Practice missed again</button>
        ) : (
          <button className="primary" onClick={onRestart}>Retake this deck</button>
        )}
        <button className="link-button" onClick={onExit}>
          Back to decks
        </button>
      </div>
    </div>
  )
}
