import { useState } from 'react'
import { getMissLog, missLogToJson, missLogToMarkdown } from '../state/missLog'
import { ExpandableList } from './ExpandableList'
import { QuestionReview } from './QuestionReview'
import { ScreenHeader } from './ScreenHeader'

interface MissedLogViewProps {
  onExit: () => void
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function MissedLogView({ onExit }: MissedLogViewProps) {
  const [records] = useState(() => getMissLog())
  const [deckFilter, setDeckFilter] = useState('all')
  const [copied, setCopied] = useState(false)

  const decks = new Map(records.map((r) => [r.deckSlug, r.deckTitle]))
  const visible = deckFilter === 'all' ? records : records.filter((r) => r.deckSlug === deckFilter)
  const stamp = new Date().toISOString().slice(0, 10)
  const baseName = `quizme-missed-${deckFilter === 'all' ? 'all' : deckFilter}-${stamp}`

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(missLogToMarkdown(visible))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — the download buttons still work.
    }
  }

  return (
    <div className="missed-log">
      <ScreenHeader onExit={onExit}>
        <span className="header-counter">{visible.length} missed</span>
      </ScreenHeader>

      <h1>All missed questions</h1>

      {records.length === 0 ? (
        <p>No missed questions recorded yet.</p>
      ) : (
        <>
          <div className="missed-log-controls">
            {decks.size > 1 && (
              <select aria-label="Filter by deck" value={deckFilter} onChange={(e) => setDeckFilter(e.target.value)}>
                <option value="all">All decks</option>
                {[...decks.entries()].map(([slug, title]) => (
                  <option key={slug} value={slug}>
                    {title}
                  </option>
                ))}
              </select>
            )}
            <button onClick={() => download(`${baseName}.md`, missLogToMarkdown(visible), 'text/markdown')}>
              Export Markdown
            </button>
            <button onClick={() => download(`${baseName}.json`, missLogToJson(visible), 'application/json')}>
              Export JSON
            </button>
            <button className="link-button" onClick={copyMarkdown}>
              {copied ? 'Copied' : 'Copy Markdown'}
            </button>
          </div>

          <ExpandableList
            items={visible}
            itemKey={(r) => `${r.deckSlug}:${r.questionId}`}
            label={(r) => r.prompt}
            meta={(r) => `${r.deckTitle} · missed ${r.missCount}× · last ${r.lastMissedAt.slice(0, 10)}`}
            detail={(r) => <QuestionReview options={r.options} explanation={r.explanation} />}
          />
        </>
      )}
    </div>
  )
}
