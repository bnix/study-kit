import { describe, expect, it } from 'vitest'
import { parseDeck } from './parseDeck'

describe('parseDeck', () => {
  it('parses deck frontmatter', () => {
    const raw = `---
title: Bedrock Basics
cert: AWS Certified GenAI Professional
tags: [bedrock, rag]
---

### What is Amazon Bedrock?

- [x] A fully managed service for foundation models.
- [ ] A relational database engine.
`
    const deck = parseDeck(raw, 'bedrock-basics')

    expect(deck.slug).toBe('bedrock-basics')
    expect(deck.title).toBe('Bedrock Basics')
    expect(deck.cert).toBe('AWS Certified GenAI Professional')
    expect(deck.tags).toEqual(['bedrock', 'rag'])
    expect(deck.questions).toHaveLength(1)
  })

  it('parses a single-select question with explanation and a reference', () => {
    const raw = `---
title: Sample
---

### A company wants the least operational overhead.

Which approach should they use?

- [ ] Manually chunk and embed documents.
- [x] Use a Bedrock Knowledge Base data source.
- [ ] Run a nightly Lambda re-embedding job.

> A Knowledge Base handles chunking and embedding automatically.

Learn more: [Knowledge Base ingestion](https://docs.aws.amazon.com/bedrock/ingest.html)
`
    const [question] = parseDeck(raw, 'sample').questions

    expect(question.prompt).toContain('least operational overhead')
    expect(question.prompt).toContain('Which approach should they use?')
    expect(question.multiSelect).toBe(false)
    expect(question.options).toHaveLength(3)
    expect(question.options.filter((o) => o.correct)).toHaveLength(1)
    expect(question.options[1]).toMatchObject({ id: 'B', correct: true })
    expect(question.explanation).toContain('handles chunking and embedding automatically')
    expect(question.references).toEqual([
      { text: 'Knowledge Base ingestion', url: 'https://docs.aws.amazon.com/bedrock/ingest.html' },
    ])
  })

  it('marks a question multi-select when more than one option is checked', () => {
    const raw = `---
title: Sample
---

### Select TWO valid approaches.

- [x] Option one.
- [x] Option two.
- [ ] Option three.
`
    const [question] = parseDeck(raw, 'sample').questions

    expect(question.multiSelect).toBe(true)
    expect(question.options.filter((o) => o.correct)).toHaveLength(2)
  })

  it('handles a question with no explanation and no references', () => {
    const raw = `---
title: Sample
---

### A bare question with no explanation.

- [x] Correct option.
- [ ] Wrong option.
`
    const [question] = parseDeck(raw, 'sample').questions

    expect(question.explanation).toBeUndefined()
    expect(question.references).toEqual([])
  })

  it('collects multiple reference links after the explanation', () => {
    const raw = `---
title: Sample
---

### A question with multiple references.

- [x] Correct option.
- [ ] Wrong option.

> Explanation text.

Learn more: [First doc](https://docs.aws.amazon.com/first.html)
Learn more: [Second doc](https://docs.aws.amazon.com/second.html)
`
    const [question] = parseDeck(raw, 'sample').questions

    expect(question.references).toEqual([
      { text: 'First doc', url: 'https://docs.aws.amazon.com/first.html' },
      { text: 'Second doc', url: 'https://docs.aws.amazon.com/second.html' },
    ])
  })

  it('derives a stable question id from prompt text regardless of file position', () => {
    const rawA = `---
title: A
---

### The same question text.

- [x] Correct.
- [ ] Wrong.
`
    const rawB = `---
title: B
---

### Filler heading.

- [x] Filler correct.

### The same question text.

- [x] Correct.
- [ ] Wrong.
`
    const questionA = parseDeck(rawA, 'a').questions[0]
    const questionB = parseDeck(rawB, 'b').questions[1]

    expect(questionA.id).toBe(questionB.id)
  })
})
