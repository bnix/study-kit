import type { Option } from '../types'

interface QuestionReviewProps {
  options: Option[]
  explanation?: string
}

/** A question's options with the correct ones marked, then its explanation. */
export function QuestionReview({ options, explanation }: QuestionReviewProps) {
  return (
    <div className="review-detail">
      <ul className="review-options">
        {options.map((option) => (
          <li key={option.id} className={option.correct ? 'correct' : ''}>
            {option.id}. {option.text}
          </li>
        ))}
      </ul>
      {explanation && <p className="explanation">{explanation}</p>}
    </div>
  )
}
