# Quiz Me

A browser-based practice-test app for AWS certification study. Reads decks of
multiple-choice questions from Markdown files and quizzes them one at a time,
with immediate feedback, an end-of-session score, and history tracked across
sessions.

## Setup

```
npm install
```

Quiz content is read from `content/` at the project root, which is a symlink
to a curated folder inside your notes vault (kept out of git, since it's a
machine-specific absolute path). To set it up:

```
ln -s /path/to/your/vault/QuizMeDecks content
```

If the vault folder lives somewhere other than
`/var/home/bryan/Documents/ObsidianVault/QuizMeDecks`, update
`VAULT_CONTENT_PATH` in `vite.config.ts` to match — Vite's dev server only
serves files whose real path is explicitly allowed via `server.fs.allow`,
even when reached through an in-repo symlink.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm test` — run the test suite (Vitest)

## Deck format

Each `.md` file under `content/` is one deck (a topic or exam section).
Folders under `content/` are organizational only — not parsed.

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

Rules:

- **Frontmatter** (YAML, required): `title` is required; `cert` and `tags`
  are optional deck-level metadata.
- **Questions** start at a `### ` heading (depth 3) and run until the next
  `### ` heading or end of file. Any paragraph text between the heading and
  the option list is part of the prompt, so multi-paragraph scenarios work.
- **Options** are a single GFM task list (`- [ ]` / `- [x]`) right after the
  prompt. Checked items are correct. More than one checked item
  automatically makes it a multi-select question (checkbox UI) — no extra
  flag needed.
- **Explanation** is the first blockquote (`> ...`) after the option list.
  Optional but recommended.
- **References** are any markdown links after the explanation, shown as
  "Learn more" links. Optional, any number.

A question's identity (used for history tracking) is derived from a hash of
its prompt text, so reordering questions in a deck doesn't reset history.
