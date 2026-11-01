import type { useQuizSession } from '../state/useQuizSession'

interface QuizViewProps {
  session: ReturnType<typeof useQuizSession>
  onExit: () => void
}

export function QuizView({ session, onExit }: QuizViewProps) {
  const { currentQuestion, questionNumber, totalQuestions, selected, answered, isCorrect, toggleOption, submit, next } =
    session

  if (!currentQuestion) return null

  const inputType = currentQuestion.multiSelect ? 'checkbox' : 'radio'

  return (
    <div className="quiz-view">
      <div className="quiz-header">
        <button className="link-button" onClick={onExit}>
          &larr; Back to decks
        </button>
        <span>
          Question {questionNumber} / {totalQuestions}
        </span>
      </div>

      <p className="prompt">{currentQuestion.prompt}</p>
      {currentQuestion.multiSelect && <p className="hint">Select all that apply.</p>}

      <ul className="options">
        {currentQuestion.options.map((option) => {
          const isSelected = selected.includes(option.id)
          const showResult = answered
          const resultClass = showResult
            ? option.correct
              ? 'correct'
              : isSelected
                ? 'incorrect'
                : ''
            : ''

          return (
            <li key={option.id} className={resultClass}>
              <label>
                <input
                  type={inputType}
                  name="option"
                  checked={isSelected}
                  disabled={answered}
                  onChange={() => toggleOption(option.id)}
                />
                <span className="option-id">{option.id}.</span> {option.text}
              </label>
            </li>
          )
        })}
      </ul>

      {!answered && (
        <button onClick={submit} disabled={selected.length === 0}>
          Submit
        </button>
      )}

      {answered && (
        <div className="feedback">
          <p className={isCorrect ? 'correct' : 'incorrect'}>{isCorrect ? 'Correct!' : 'Not quite.'}</p>
          {currentQuestion.explanation && <p className="explanation">{currentQuestion.explanation}</p>}
          {currentQuestion.references.length > 0 && (
            <ul className="references">
              {currentQuestion.references.map((ref) => (
                <li key={ref.url}>
                  <a href={ref.url} target="_blank" rel="noreferrer">
                    {ref.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <button onClick={next}>{questionNumber === totalQuestions ? 'See results' : 'Next question'}</button>
        </div>
      )}
    </div>
  )
}
