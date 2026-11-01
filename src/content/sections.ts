import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { Heading, Root, RootContent } from 'mdast'

const processor = unified().use(remarkParse).use(remarkGfm)

/** One `### ` heading and the nodes under it, up to the next `### ` heading. */
export interface Section {
  heading: Heading
  body: RootContent[]
}

/**
 * Splits a deck body into its `### ` sections — one per question or card in
 * every deck kind. Content before the first `### ` heading is ignored.
 */
export function splitSections(markdown: string): Section[] {
  const tree = processor.parse(markdown) as Root
  const sections: Section[] = []
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 3) sections.push({ heading: node, body: [] })
    else sections.at(-1)?.body.push(node)
  }
  return sections
}
