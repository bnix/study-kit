# Quiz Me

A study app that runs in your browser and turns Markdown files into practice
tests and spaced-repetition flash cards. It was built for AWS certification
prep, but a deck can cover any subject: write questions or cards in plain
Markdown, for example in your notes app, and study them here.

## Features

- **Quizzes**: multiple-choice and "select all that apply" questions, one at
  a time, with immediate feedback, an explanation, and reference links. Each
  run ends with a score and a review of what you missed.
- **Picks up where you left off**: leave a quiz partway through and it
  resumes there next time. Each deck shows how many questions you've
  mastered.
- **Practice what you missed**: rerun only the questions whose most recent
  answer was wrong.
- **Missed-question log**: every question you've ever missed, across all
  decks, with the answers you gave. Filter it by deck and export it as
  Markdown or JSON, for example to ask an AI assistant for more practice
  questions on your weak spots.
- **Flash cards with spaced repetition**: reveal the answer, rate how well
  you remembered it, and the app schedules the card's next review (using
  the [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) algorithm).
  Cards you know come back less often; cards you miss come back sooner.

## Quick start

You need [Node.js](https://nodejs.org/) 24 or later.

```sh
npm install
npm run dev
```

Open http://localhost:5173. Until you add your own decks, the app shows the
two example decks in [`examples/decks/`](examples/decks/).

## Adding your decks

The app reads every `.md` file under a `content/` folder in the project root.
Subfolders are fine. `content/` is excluded from git, so your decks stay
private. Either:

- **Create the folder** and put deck files in it:

  ```sh
  mkdir content
  cp examples/decks/*.md content/
  ```

- **Or link it to a folder you already keep notes in**, such as an Obsidian
  vault, so you can edit decks where you write everything else:

  ```sh
  ln -s /path/to/your/notes/QuizMeDecks content
  ```

Restart `npm run dev` after creating the folder or link. After that, edits to
deck files show up when you reload the page.

## Writing decks

A deck is a Markdown file with a small YAML header. Each `###` heading starts
a question.

```markdown
---
title: AWS Fundamentals
cert: AWS Certified Cloud Practitioner
---

### Which AWS service provides object storage?

- [x] Amazon S3
- [ ] Amazon EBS
- [ ] Amazon EFS

> S3 stores objects in buckets. EBS is block storage and EFS is a shared file system.
```

Checked items (`[x]`) are the correct answers; check more than one for a
"select all that apply" question. The blockquote is the explanation shown
after you answer. `cert` groups decks in the deck picker.

For flash cards, add `kind: flashcards` to the header. Each heading is then a
card's front, and the Markdown under it is the back:

```markdown
---
title: RAG Basics
kind: flashcards
---

### What does RAG stand for?

**Retrieval-augmented generation**: relevant documents are retrieved at query time and added to the prompt.
```

See [docs/deck-format.md](docs/deck-format.md) for the full format, including
reference links, code snippets on the front of a card, and how editing a deck
affects your saved progress.

## Studying flash cards

Click a card deck to review the cards that are due, plus a daily allowance of
new cards (20 by default). After revealing each answer, rate how well you
remembered it:

| Rating | Meaning |
|---|---|
| **Again** | You forgot it. It comes back a few cards later in this session. |
| **Hard** | You remembered it, with difficulty. |
| **Good** | You remembered it. |
| **Easy** | You knew it instantly. |

During a review, each button shows when you'd see the card next. **Study all** runs through
every card in the deck without changing its schedule, for last-minute review.

| Key | Action |
|---|---|
| Space or Enter | Reveal the answer; once revealed, rate **Good** |
| 1 / 2 / 3 / 4 | Rate Again / Hard / Good / Easy |
| U | Undo the last rating |
| Esc | Back to the deck list |

## Where your progress is stored

Quiz history, the missed-question log, and flash card schedules are saved in
your browser's local storage. That means:

- Progress belongs to one browser on one device. It doesn't sync, and it
  isn't backed up.
- Clearing this site's data in your browser erases it.
- **Reset** on a deck clears that deck's quiz history or card schedule. The
  missed-question log is never reset.

## Development

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run the tests (Vitest) |
| `npm run build` | Type-check and build a static site into `dist/` |
| `npm run preview` | Serve the built site locally |

Decks are bundled into the build, so a deployed build contains your deck
files. Keep that in mind before publishing one. The tests run against your
`content/` decks, or the examples if you have none.

Built with React, TypeScript, and Vite. Decks are parsed with
[remark](https://github.com/remarkjs/remark).
