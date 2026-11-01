import type { useQuizSession } from '../state/useQuizSession'
import { Meter } from './Meter'
import { ScreenHeader } from './ScreenHeader'

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
      <ScreenHeader onExit={onExit}>
        <span
          className="header-counter"
          data-testid="quiz-counter"
          data-question={questionNumber}
          data-total={totalQuestions}
        >
          Question {questionNumber} of {totalQuestions}
        </span>
      </ScreenHeader>

      <Meter className="quiz-progress" value={questionNumber} max={totalQuestions} />

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
                <span className="option-id">{option.id}.</span> <span className="option-text">{option.text}</span>
              </label>
            </li>
          )
        })}
      </ul>

      {!answered && (
        <button className="primary" onClick={submit} disabled={selected.length === 0}>
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
          <button className="primary" onClick={next}>{questionNumber === totalQuestions ? 'See results' : 'Next question'}</button>
        </div>
      )}
    </div>
  )
}
