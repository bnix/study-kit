# Deck format

Each `.md` file under `content/` is one deck. Folders are only for your own
organization: the app finds every `.md` file at any depth. Working examples of
both deck kinds are in [`examples/decks/`](../examples/decks/).

Every deck starts with YAML frontmatter:

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | Deck name shown in the deck picker. |
| `cert` | no | Group heading in the deck picker (e.g. an exam name). Decks without one go under "Other". |
| `tags` | no | Free-form list, e.g. `[bedrock, rag]`. |
| `kind` | no | `flashcards` for a flash card deck; leave it out for a quiz. |
| `new_per_day` | no | Flash cards only: most new cards a review session introduces per day (default 20). |

After the frontmatter, each `### ` heading (exactly three `#`) starts a new
question or card, which runs until the next `### ` heading. Anything before
the first one is ignored, so you can put notes there.

## Quiz decks

```markdown
---
title: Bedrock Data Ingestion and OpenSearch
cert: AWS Certified GenAI Professional
tags: [bedrock, opensearch, rag]
---

### A company needs to ingest documents into a knowledge base for RAG. Which approach meets the requirement with the least operational overhead?

- [ ] Manually chunk and embed documents, then write vectors directly to OpenSearch.
- [x] Use an Amazon Bedrock Knowledge Base data source with automatic chunking.
- [ ] Run a Lambda function nightly to re-embed the entire corpus.
- [ ] Store raw documents in S3 and query them with Athena at inference time.

> A Bedrock Knowledge Base data source handles chunking, embedding, and indexing automatically, removing the need to manage a custom ingestion pipeline.

Learn more: [Ingesting data into a knowledge base](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-ingest.html)
```

- **Prompt**: the heading, plus any paragraphs between it and the options, so
  multi-paragraph scenarios work.
- **Options**: one task list (`- [ ]` / `- [x]`) after the prompt. Checked
  items are correct. More than one checked item makes it a "select all that
  apply" question automatically.
- **Explanation** (optional, recommended): the first blockquote (`> ...`)
  after the options, shown once you've answered.
- **References** (optional): any links after the explanation, shown as
  "Learn more" links.

A section with no task list is skipped. Quiz text is shown as plain text, so
Markdown formatting such as bold or code isn't rendered.

## Flash card decks

Add `kind: flashcards` to the frontmatter. Each heading is a card's front, and
everything under it is the back, rendered as full Markdown: bold, lists, code
blocks, tables and links all work.

````markdown
---
title: Bedrock Building Blocks
kind: flashcards
cert: AWS Certified GenAI Professional
---

### What three steps does a Bedrock Knowledge Base data source automate?

Chunking, embedding, and indexing into a vector store.

### What does this policy allow?

```json
{ "Effect": "Allow", "Action": "bedrock:InvokeModel", "Resource": "*" }
```

?

Invoking any Bedrock model, in any Region, with no conditions.
````

- **Extra front content**: a line containing only `?`, with blank lines
  around it, splits a card. Content above it appears on the front under the
  heading, which is useful for code snippets or scenarios. Don't use `---`
  for this: a line of text directly above `---` turns into a heading in
  Markdown.
- A `---` at the end of a card, used as a visual separator between cards, is
  ignored.
- Cards with no answer, or with the same front as an earlier card, are
  skipped and listed as warnings under the deck in the deck picker.
- Keep each front to one fact. A card that takes a paragraph to answer is
  usually two or three cards.

## Editing decks without losing progress

Progress is tracked per question or card, keyed by its text:

- **Quiz questions** are identified by their prompt. Reordering questions is
  safe; changing a prompt's wording starts that question's history over.
- **Flash cards** are identified by their front. Editing the back keeps the
  card's review schedule; editing the front starts the card over as new.
