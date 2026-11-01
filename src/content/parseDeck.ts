import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { toString as mdastToString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import type { Blockquote, Heading, Link, List, Root, RootContent } from 'mdast'
import type { Deck, Option, Question, Reference } from '../types'
import { splitFrontmatter } from './frontmatter'
import { hashText } from './hash'

const processor = unified().use(remarkParse).use(remarkGfm)

function parseFrontmatter(raw: string) {
  const { data, content } = splitFrontmatter(raw)
  const title = typeof data.title === 'string' ? data.title : 'Untitled deck'
  const cert = typeof data.cert === 'string' ? data.cert : undefined
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : []
  return { title, cert, tags, content }
}

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

function buildQuestion(heading: Heading, bodyNodes: RootContent[]): Question | null {
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

/** Parses one deck file's raw markdown source into a `Deck`. See README for the format spec. */
export function parseDeck(raw: string, slug: string): Deck {
  const { title, cert, tags, content } = parseFrontmatter(raw)
  const tree = processor.parse(content) as Root

  const questions: Question[] = []
  let currentHeading: Heading | null = null
  let currentBody: RootContent[] = []

  const flush = () => {
    if (currentHeading) {
      const question = buildQuestion(currentHeading, currentBody)
      if (question) questions.push(question)
    }
  }

  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 3) {
      flush()
      currentHeading = node
      currentBody = []
    } else if (currentHeading) {
      currentBody.push(node)
    }
  }
  flush()

  return { slug, title, cert, tags, questions }
}
