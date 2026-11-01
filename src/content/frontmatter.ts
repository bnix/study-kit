import { load } from 'js-yaml'

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/**
 * Splits a leading `---`-delimited YAML frontmatter block off a markdown
 * string. Deliberately hand-rolled instead of using gray-matter, which
 * depends on Node's `Buffer` and breaks when bundled for the browser.
 */
export function splitFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(FRONTMATTER_PATTERN)
  if (!match) return { data: {}, content: raw }

  const data = (load(match[1]) as Record<string, unknown> | undefined) ?? {}
  const content = raw.slice(match[0].length)
  return { data, content }
}
