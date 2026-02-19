/**
 * Zero-dependency Markdown parser that converts a Markdown string into an AST.
 */

export type MarkdownNode = HeadingNode | ParagraphNode | CodeBlockNode | BlockquoteNode | ListNode | HorizontalRuleNode

export type HeadingNode = {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: InlineNode[]
}

export type ParagraphNode = {
  type: 'paragraph'
  children: InlineNode[]
}

export type CodeBlockNode = {
  type: 'codeBlock'
  language?: string
  content: string
}

export type BlockquoteNode = {
  type: 'blockquote'
  children: MarkdownNode[]
}

export type ListNode = {
  type: 'list'
  ordered: boolean
  items: ListItemNode[]
}

export type HorizontalRuleNode = {
  type: 'horizontalRule'
}

export type ListItemNode = {
  children: InlineNode[]
  checkbox?: 'checked' | 'unchecked'
  sourceLineIndex: number
}

export type InlineNode = TextNode | BoldNode | ItalicNode | InlineCodeNode | LinkNode | ImageNode

export type TextNode = { type: 'text'; content: string }
export type BoldNode = { type: 'bold'; children: InlineNode[] }
export type ItalicNode = { type: 'italic'; children: InlineNode[] }
export type InlineCodeNode = { type: 'code'; content: string }
export type LinkNode = { type: 'link'; href: string; children: InlineNode[] }
export type ImageNode = { type: 'image'; src: string; alt: string }

const HORIZONTAL_RULE_RE = /^(\*{3,}|-{3,}|_{3,})\s*$/
const HEADING_RE = /^(#{1,6})\s+(.*)/
const FENCED_CODE_OPEN_RE = /^```(\w*)\s*$/
const FENCED_CODE_CLOSE_RE = /^```\s*$/
const UNORDERED_LIST_RE = /^(\s*)[-*]\s+(.*)/
const ORDERED_LIST_RE = /^(\s*)\d+\.\s+(.*)/
const BLOCKQUOTE_RE = /^>\s?(.*)/
const CHECKBOX_UNCHECKED_RE = /^\[[ ]\]\s+(.*)/
const CHECKBOX_CHECKED_RE = /^\[[xX]\]\s+(.*)/

/**
 * Parse inline Markdown formatting into an array of InlineNodes.
 *
 * Known limitations:
 * - Backslash escapes (e.g. `\*`) are not supported; special characters are always interpreted.
 * - Underscore `_` markers are not restricted to word boundaries, so identifiers like
 *   `some_variable_name` may produce false italic/bold matches.
 */
export const parseInline = (text: string): InlineNode[] => {
  const nodes: InlineNode[] = []
  let pos = 0

  while (pos < text.length) {
    // Inline code
    if (text[pos] === '`') {
      const closeIdx = text.indexOf('`', pos + 1)
      if (closeIdx !== -1) {
        nodes.push({ type: 'code', content: text.slice(pos + 1, closeIdx) })
        pos = closeIdx + 1
        continue
      }
    }

    // Image ![alt](src)
    if (text[pos] === '!' && text[pos + 1] === '[') {
      const altClose = text.indexOf(']', pos + 2)
      if (altClose !== -1 && text[altClose + 1] === '(') {
        const srcClose = text.indexOf(')', altClose + 2)
        if (srcClose !== -1) {
          const alt = text.slice(pos + 2, altClose)
          const src = text.slice(altClose + 2, srcClose)
          nodes.push({ type: 'image', src, alt })
          pos = srcClose + 1
          continue
        }
      }
    }

    // Link [text](href)
    if (text[pos] === '[') {
      const textClose = text.indexOf(']', pos + 1)
      if (textClose !== -1 && text[textClose + 1] === '(') {
        const hrefClose = text.indexOf(')', textClose + 2)
        if (hrefClose !== -1) {
          const linkText = text.slice(pos + 1, textClose)
          const href = text.slice(textClose + 2, hrefClose)
          nodes.push({ type: 'link', href, children: parseInline(linkText) })
          pos = hrefClose + 1
          continue
        }
      }
    }

    // Bold+Italic (***text***) or Bold (**text**) or Italic (*text*)
    if (text[pos] === '*' || text[pos] === '_') {
      const marker = text[pos]

      // Count consecutive markers
      let markerCount = 0
      while (pos + markerCount < text.length && text[pos + markerCount] === marker) {
        markerCount++
      }

      if (markerCount >= 3) {
        const closeIdx = text.indexOf(marker.repeat(3), pos + 3)
        if (closeIdx !== -1) {
          const inner = text.slice(pos + 3, closeIdx)
          nodes.push({ type: 'bold', children: [{ type: 'italic', children: parseInline(inner) }] })
          pos = closeIdx + 3
          continue
        }
      }

      if (markerCount >= 2) {
        const closeIdx = text.indexOf(marker.repeat(2), pos + 2)
        if (closeIdx !== -1) {
          const inner = text.slice(pos + 2, closeIdx)
          nodes.push({ type: 'bold', children: parseInline(inner) })
          pos = closeIdx + 2
          continue
        }
      }

      if (markerCount >= 1) {
        const closeIdx = text.indexOf(marker, pos + 1)
        if (closeIdx !== -1) {
          const inner = text.slice(pos + 1, closeIdx)
          nodes.push({ type: 'italic', children: parseInline(inner) })
          pos = closeIdx + 1
          continue
        }
      }
    }

    // Plain text — consume until the next special character
    let end = pos + 1
    while (end < text.length && !['`', '!', '[', '*', '_'].includes(text[end])) {
      end++
    }
    const content = text.slice(pos, end)
    const lastNode = nodes[nodes.length - 1]
    if (lastNode?.type === 'text') {
      lastNode.content += content
    } else {
      nodes.push({ type: 'text', content })
    }
    pos = end
  }

  return nodes
}

/**
 * Parse a Markdown string into an array of block-level MarkdownNodes.
 */
export const parseMarkdown = (source: string): MarkdownNode[] => {
  const lines = source.split('\n')
  const nodes: MarkdownNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank lines — skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Fenced code block
    const codeMatch = FENCED_CODE_OPEN_RE.exec(line)
    if (codeMatch) {
      const language = codeMatch[1] || undefined
      const codeLines: string[] = []
      i++
      while (i < lines.length && !FENCED_CODE_CLOSE_RE.test(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push({ type: 'codeBlock', language, content: codeLines.join('\n') })
      i++ // skip closing ```
      continue
    }

    // Horizontal rule
    if (HORIZONTAL_RULE_RE.test(line)) {
      nodes.push({ type: 'horizontalRule' })
      i++
      continue
    }

    // Heading
    const headingMatch = HEADING_RE.exec(line)
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6
      nodes.push({ type: 'heading', level, children: parseInline(headingMatch[2]) })
      i++
      continue
    }

    // Blockquote
    const bqMatch = BLOCKQUOTE_RE.exec(line)
    if (bqMatch) {
      const bqLines: string[] = []
      while (i < lines.length) {
        const bqLineMatch = BLOCKQUOTE_RE.exec(lines[i])
        if (bqLineMatch) {
          bqLines.push(bqLineMatch[1])
          i++
        } else {
          break
        }
      }
      nodes.push({ type: 'blockquote', children: parseMarkdown(bqLines.join('\n')) })
      continue
    }

    // Unordered list
    const ulMatch = UNORDERED_LIST_RE.exec(line)
    if (ulMatch) {
      const items: ListItemNode[] = []
      while (i < lines.length) {
        const itemMatch = UNORDERED_LIST_RE.exec(lines[i])
        if (!itemMatch) break
        const itemText = itemMatch[2]
        const checkedMatch = CHECKBOX_CHECKED_RE.exec(itemText)
        const uncheckedMatch = CHECKBOX_UNCHECKED_RE.exec(itemText)
        if (checkedMatch) {
          items.push({
            children: parseInline(checkedMatch[1]),
            checkbox: 'checked',
            sourceLineIndex: i,
          })
        } else if (uncheckedMatch) {
          items.push({
            children: parseInline(uncheckedMatch[1]),
            checkbox: 'unchecked',
            sourceLineIndex: i,
          })
        } else {
          items.push({
            children: parseInline(itemText),
            sourceLineIndex: i,
          })
        }
        i++
      }
      nodes.push({ type: 'list', ordered: false, items })
      continue
    }

    // Ordered list
    const olMatch = ORDERED_LIST_RE.exec(line)
    if (olMatch) {
      const items: ListItemNode[] = []
      while (i < lines.length) {
        const itemMatch = ORDERED_LIST_RE.exec(lines[i])
        if (!itemMatch) break
        items.push({
          children: parseInline(itemMatch[2]),
          sourceLineIndex: i,
        })
        i++
      }
      nodes.push({ type: 'list', ordered: true, items })
      continue
    }

    // Paragraph — collect consecutive non-blank, non-block-start lines
    const paraLines: string[] = []
    while (i < lines.length) {
      const pLine = lines[i]
      if (pLine.trim() === '') break
      if (HEADING_RE.test(pLine)) break
      if (FENCED_CODE_OPEN_RE.test(pLine)) break
      if (HORIZONTAL_RULE_RE.test(pLine)) break
      if (BLOCKQUOTE_RE.test(pLine)) break
      if (UNORDERED_LIST_RE.test(pLine)) break
      if (ORDERED_LIST_RE.test(pLine)) break
      paraLines.push(pLine)
      i++
    }
    if (paraLines.length > 0) {
      nodes.push({ type: 'paragraph', children: parseInline(paraLines.join(' ')) })
    }
  }

  return nodes
}

const TOGGLE_UNCHECKED_RE = /^(\s*[-*]\s+)\[ \]/
const TOGGLE_CHECKED_RE = /^(\s*[-*]\s+)\[[xX]\]/

/**
 * Toggle a checkbox at the given source line index in the raw Markdown string.
 * Only matches checkboxes in unordered list items (`- [ ]` or `* [x]`).
 * Returns the updated string.
 */
export const toggleCheckbox = (source: string, sourceLineIndex: number): string => {
  const lines = source.split('\n')
  if (sourceLineIndex < 0 || sourceLineIndex >= lines.length) return source

  const line = lines[sourceLineIndex]
  if (TOGGLE_UNCHECKED_RE.test(line)) {
    lines[sourceLineIndex] = line.replace(TOGGLE_UNCHECKED_RE, '$1[x]')
  } else if (TOGGLE_CHECKED_RE.test(line)) {
    lines[sourceLineIndex] = line.replace(TOGGLE_CHECKED_RE, '$1[ ]')
  }
  return lines.join('\n')
}
