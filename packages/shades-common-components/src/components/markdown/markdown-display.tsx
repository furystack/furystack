import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { Checkbox } from '../inputs/checkbox.js'
import { Typography } from '../typography.js'
import type { InlineNode, MarkdownNode } from './markdown-parser.js'
import { parseMarkdown, toggleCheckbox } from './markdown-parser.js'

export type MarkdownDisplayProps = {
  /** The raw Markdown string to render */
  content: string
  /** When false, checkboxes can be toggled. Defaults to true. */
  readOnly?: boolean
  /** Called with the updated Markdown string when a checkbox is toggled */
  onChange?: (newContent: string) => void
}

const renderInline = (nodes: InlineNode[]): JSX.Element => {
  return (
    <>
      {nodes.map((node) => {
        switch (node.type) {
          case 'text':
            return <>{node.content}</>
          case 'bold':
            return <strong>{renderInline(node.children)}</strong>
          case 'italic':
            return <em>{renderInline(node.children)}</em>
          case 'code':
            return <code className="md-inline-code">{node.content}</code>
          case 'link':
            return (
              <a className="md-link" href={node.href} target="_blank" rel="noopener noreferrer">
                {renderInline(node.children)}
              </a>
            )
          case 'image':
            return <img className="md-image" src={node.src} alt={node.alt} />
          default:
            return <></>
        }
      })}
    </>
  )
}

const variantForLevel = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  const map = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const
  return map[level]
}

const renderBlock = (
  node: MarkdownNode,
  _index: number,
  options: { content: string; readOnly: boolean; onChange?: (newContent: string) => void },
): JSX.Element => {
  switch (node.type) {
    case 'heading':
      return <Typography variant={variantForLevel(node.level)}>{renderInline(node.children)}</Typography>
    case 'paragraph':
      return <Typography variant="body1">{renderInline(node.children)}</Typography>
    case 'codeBlock':
      return (
        <pre className="md-code-block" data-language={node.language || undefined}>
          <code>{node.content}</code>
        </pre>
      )
    case 'blockquote':
      return (
        <blockquote className="md-blockquote">
          {node.children.map((child, i) => renderBlock(child, i, options))}
        </blockquote>
      )
    case 'horizontalRule':
      return <hr className="md-hr" />
    case 'list': {
      const listItems = node.items.map((item) => {
        if (item.checkbox !== undefined) {
          const handleChange = () => {
            if (!options.readOnly && options.onChange) {
              options.onChange(toggleCheckbox(options.content, item.sourceLineIndex))
            }
          }
          return (
            <li className="md-list-item md-checkbox-item" data-source-line={String(item.sourceLineIndex)}>
              <Checkbox checked={item.checkbox === 'checked'} disabled={options.readOnly} onchange={handleChange} />
              <span className="md-checkbox-label">{renderInline(item.children)}</span>
            </li>
          )
        }
        return <li className="md-list-item">{renderInline(item.children)}</li>
      })
      if (node.ordered) {
        return <ol className="md-list">{listItems}</ol>
      }
      return <ul className="md-list">{listItems}</ul>
    }
    default:
      return <></>
  }
}

/**
 * Renders a Markdown string using FuryStack Shades components.
 * Supports headings, paragraphs, lists, checkboxes, code blocks,
 * blockquotes, images, links, and horizontal rules.
 */
export const MarkdownDisplay = Shade<MarkdownDisplayProps>({
  shadowDomName: 'shade-markdown-display',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,
    color: cssVariableTheme.text.primary,
    lineHeight: cssVariableTheme.typography.lineHeight.relaxed,

    '& .md-inline-code': {
      fontFamily: 'monospace',
      backgroundColor: cssVariableTheme.action.hoverBackground,
      padding: '2px 6px',
      borderRadius: cssVariableTheme.shape.borderRadius.xs,
      fontSize: '0.9em',
    },

    '& .md-code-block': {
      fontFamily: 'monospace',
      backgroundColor: cssVariableTheme.background.default,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      padding: cssVariableTheme.spacing.md,
      overflow: 'auto',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      margin: `${cssVariableTheme.spacing.sm} 0`,
    },

    '& .md-code-block code': {
      font: 'inherit',
      whiteSpace: 'pre',
    },

    '& .md-blockquote': {
      borderLeft: `4px solid ${cssVariableTheme.palette.primary.main}`,
      margin: `${cssVariableTheme.spacing.sm} 0`,
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
      color: cssVariableTheme.text.secondary,
    },

    '& .md-link': {
      color: cssVariableTheme.palette.primary.main,
      textDecoration: 'none',
    },
    '& .md-link:hover': {
      textDecoration: 'underline',
    },

    '& .md-image': {
      maxWidth: '100%',
      borderRadius: cssVariableTheme.shape.borderRadius.md,
    },

    '& .md-hr': {
      border: 'none',
      borderTop: `1px solid ${cssVariableTheme.divider}`,
      margin: `${cssVariableTheme.spacing.md} 0`,
    },

    '& .md-list': {
      paddingLeft: cssVariableTheme.spacing.xl,
      margin: `${cssVariableTheme.spacing.sm} 0`,
    },

    '& .md-list-item': {
      marginBottom: cssVariableTheme.spacing.xs,
      fontSize: cssVariableTheme.typography.fontSize.md,
    },

    '& .md-checkbox-item': {
      listStyle: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
    },

    '& .md-checkbox-label': {
      fontSize: cssVariableTheme.typography.fontSize.md,
    },
  },
  render: ({ props }) => {
    const readOnly = props.readOnly !== false
    const ast = parseMarkdown(props.content)

    return (
      <div className="md-root">
        {ast.map((node, i) =>
          renderBlock(node, i, {
            content: props.content,
            readOnly,
            onChange: props.onChange,
          }),
        )}
      </div>
    )
  },
})
