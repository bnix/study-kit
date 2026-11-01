import { toString as mdastToString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import type { Blockquote, Link, List, RootContent } from 'mdast'
import type { QuizDeck, Option, Question, Reference } from '../types'
import type { DeckMeta } from './frontmatter'
import { hashText } from './hash'
import { splitSections, type Section } from './sections'

function extractReferences(nodes: RootContent[]): Reference[] {
  const references: Reference[] = []
  for (const node of nodes) {
    visit(node, 'link', (link) => {
      const linkNode = link as Link
      references.push({ text: mdastToString(linkNode), url: linkNode.url })
    })
  }
  return references
}

const OPTION_LETTERS = 'ABCDEFGHIJ'

function buildQuestion({ heading, body: bodyNodes }: Section): Question | null {
  const list = bodyNodes.find((node): node is List => node.type === 'list')
  if (!list) return null

  const promptParts = [mdastToString(heading)]
  for (const node of bodyNodes) {
    if (node === list) break
    if (node.type === 'paragraph') promptParts.push(mdastToString(node))
  }
  const prompt = promptParts.filter(Boolean).join('\n\n')

  const options: Option[] = list.children.map((item, index) => ({
    id: OPTION_LETTERS[index] ?? String(index + 1),
    text: mdastToString(item).trim(),
    correct: item.checked === true,
  }))

  const afterList = bodyNodes.slice(bodyNodes.indexOf(list) + 1)
  const blockquote = afterList.find((node): node is Blockquote => node.type === 'blockquote')
  const explanation = blockquote ? mdastToString(blockquote).trim() : undefined

  const afterExplanation = blockquote
    ? afterList.slice(afterList.indexOf(blockquote) + 1)
    : afterList
  const references = extractReferences(afterExplanation)

  return {
    id: hashText(prompt),
    prompt,
    options,
    multiSelect: options.filter((option) => option.correct).length > 1,
    explanation,
    references,
  }
}

/** Builds a `QuizDeck` from a parsed deck file. See the deck-format skill for the format spec. */
export function parseQuizDeck({ title, cert, tags, body }: DeckMeta, slug: string): QuizDeck {
  const questions = splitSections(body).flatMap((section) => buildQuestion(section) ?? [])
  return { kind: 'quiz', slug, title, cert, tags, questions }
}
