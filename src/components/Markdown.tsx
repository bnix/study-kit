import { useMemo, type ComponentProps } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { Root as HastRoot } from 'hast'
import type { RootContent } from 'mdast'
import { toHast } from 'mdast-util-to-hast'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'

function ExternalLink(props: ComponentProps<'a'>) {
  return <a {...props} target="_blank" rel="noreferrer" />
}

interface MarkdownProps {
  nodes: RootContent[]
  className?: string
}

/** Renders parsed markdown (mdast) as React. Raw HTML in the source is dropped, not rendered. */
export function Markdown({ nodes, className }: MarkdownProps) {
  const content = useMemo(() => {
    const hast = toHast({ type: 'root', children: nodes }) as HastRoot
    return toJsxRuntime(hast, { Fragment, jsx, jsxs, components: { a: ExternalLink } })
  }, [nodes])

  return <div className={`markdown ${className ?? ''}`}>{content}</div>
}
