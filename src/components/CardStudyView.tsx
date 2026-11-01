import { useEffect, useRef } from 'react'
import { Rating, type Grade } from 'ts-fsrs'
import type { CardSession, StudyMode } from '../state/useCardSession'
import { formatInterval } from './formatInterval'
import { Markdown } from './Markdown'
import { ScreenHeader } from './ScreenHeader'

const GRADES: { rating: Grade; label: string; key: string; className: string }[] = [
  { rating: Rating.Again, label: 'Again', key: '1', className: 'grade-again' },
  { rating: Rating.Hard, label: 'Hard', key: '2', className: 'grade-hard' },
  { rating: Rating.Good, label: 'Good', key: '3', className: 'grade-good' },
  { rating: Rating.Easy, label: 'Easy', key: '4', className: 'grade-easy' },
]

const GRADE_BY_KEY = new Map(GRADES.map((g) => [g.key, g.rating]))

interface CardStudyViewProps {
  session: CardSession
  mode: StudyMode
  onExit: () => void
}

export function CardStudyView({ session, mode, onExit }: CardStudyViewProps) {
  const { currentCard, revealed, previews, remaining, canUndo, reveal, grade, undo } = session
  const cardRef = useRef<HTMLElement>(null)
  const gradesRef = useRef<HTMLDivElement>(null)

  // Focus a non-button container, never a grade button: otherwise the Space that
  // revealed the answer would also activate the newly focused button on keyup.
  useEffect(() => {
    if (revealed) gradesRef.current?.focus()
    else cardRef.current?.focus()
  }, [revealed, currentCard])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      const onControl = (event.target as HTMLElement | null)?.closest?.('button, a, input, textarea, select, summary')

      if (event.key === ' ' || event.key === 'Enter') {
        if (onControl) return // let the focused control handle its own activation
        event.preventDefault()
        if (revealed) grade(Rating.Good)
        else reveal()
      } else if (revealed && GRADE_BY_KEY.has(event.key)) {
        event.preventDefault()
        grade(GRADE_BY_KEY.get(event.key)!)
      } else if (event.key === 'u' || event.key === 'U') {
        undo()
      } else if (event.key === 'Escape') {
        onExit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!currentCard) return null

  return (
    <div className="card-study">
      <ScreenHeader onExit={onExit}>
        {mode === 'review' ? (
          <span className="card-counts" data-testid="card-counts">
            <span className="count-new">{remaining.new} new</span>
            <span className="count-learning">{remaining.learning} learning</span>
            <span className="count-review">{remaining.review} review</span>
          </span>
        ) : (
          <span className="card-counts" data-testid="card-counts">
            {remaining.new + remaining.learning + remaining.review} left · not saved
          </span>
        )}
      </ScreenHeader>

      <article className="flashcard" ref={cardRef} tabIndex={-1} aria-label="Flash card">
        <Markdown className="card-front" nodes={currentCard.front} />
        <div aria-live="polite">
          {revealed && (
            <>
              <hr className="card-divider" />
              <Markdown className="card-back" nodes={currentCard.back} />
            </>
          )}
        </div>
      </article>

      <div className="card-actions">
        {revealed && previews ? (
          <div className="grade-buttons" role="group" aria-label="How well did you recall it?" ref={gradesRef} tabIndex={-1}>
            {GRADES.map(({ rating, label, key, className }) => (
              <button key={rating} className={`grade-button ${className}`} onClick={() => grade(rating)}>
                <span className="grade-label">{label}</span>
                <span className="grade-interval">
                  {mode === 'review' ? formatInterval(previews[rating].log.review, previews[rating].card.due) : key}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button className="reveal-button" onClick={reveal}>
            Show answer
          </button>
        )}
        <div className="card-hints">
          <span>
            <kbd>Space</kbd> {revealed ? 'good' : 'reveal'} · <kbd>1</kbd>–<kbd>4</kbd> rate · <kbd>Esc</kbd> exit
          </span>
          {canUndo && (
            <button className="link-button" onClick={undo}>
              Undo <kbd>U</kbd>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
