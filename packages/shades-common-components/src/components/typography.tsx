import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteMainColors } from '../services/palette-css-vars.js'
import type { Palette } from '../services/theme-provider-service.js'

/**
 * Typography variant determines semantic HTML tag and default styles.
 */
export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'overline'

/**
 * Color options for the Typography component.
 * Supports palette colors and text-level semantic colors.
 */
export type TypographyColor = keyof Palette | 'textPrimary' | 'textSecondary' | 'textDisabled'

export type TypographyProps = PartialElement<HTMLElement> & {
  /** The typographic variant to use. Determines tag and style. Defaults to 'body1'. */
  variant?: TypographyVariant
  /** Text color. Defaults to 'textPrimary'. */
  color?: TypographyColor
  /** Truncate text with ellipsis. `true` for single-line, a number for max line count. */
  ellipsis?: boolean | number
  /** Show a copy button that copies text content to clipboard. */
  copyable?: boolean
  /** Add bottom margin for spacing. */
  gutterBottom?: boolean
  /** Text alignment. */
  align?: 'left' | 'center' | 'right' | 'justify'
}

const variantStyles: Record<TypographyVariant, Record<string, string>> = {
  h1: {
    fontSize: cssVariableTheme.typography.fontSize.xl,
    fontWeight: cssVariableTheme.typography.fontWeight.bold,
    lineHeight: cssVariableTheme.typography.lineHeight.tight,
    letterSpacing: cssVariableTheme.typography.letterSpacing.tight,
    scale: '2',
  },
  h2: {
    fontSize: cssVariableTheme.typography.fontSize.xl,
    fontWeight: cssVariableTheme.typography.fontWeight.bold,
    lineHeight: cssVariableTheme.typography.lineHeight.tight,
    letterSpacing: cssVariableTheme.typography.letterSpacing.dense,
    scale: '1.6',
  },
  h3: {
    fontSize: cssVariableTheme.typography.fontSize.xl,
    fontWeight: cssVariableTheme.typography.fontWeight.semibold,
    lineHeight: cssVariableTheme.typography.lineHeight.tight,
    letterSpacing: cssVariableTheme.typography.letterSpacing.normal,
    scale: '1.3',
  },
  h4: {
    fontSize: cssVariableTheme.typography.fontSize.lg,
    fontWeight: cssVariableTheme.typography.fontWeight.semibold,
    lineHeight: cssVariableTheme.typography.lineHeight.tight,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    scale: '1.15',
  },
  h5: {
    fontSize: cssVariableTheme.typography.fontSize.lg,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: cssVariableTheme.typography.letterSpacing.normal,
    scale: '1',
  },
  h6: {
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    scale: '1.1',
  },
  subtitle1: {
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    scale: '1',
  },
  subtitle2: {
    fontSize: cssVariableTheme.typography.fontSize.sm,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: '0.1px',
    scale: '1',
  },
  body1: {
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.normal,
    lineHeight: cssVariableTheme.typography.lineHeight.relaxed,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    scale: '1',
  },
  body2: {
    fontSize: cssVariableTheme.typography.fontSize.sm,
    fontWeight: cssVariableTheme.typography.fontWeight.normal,
    lineHeight: cssVariableTheme.typography.lineHeight.relaxed,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    scale: '1',
  },
  caption: {
    fontSize: cssVariableTheme.typography.fontSize.xs,
    fontWeight: cssVariableTheme.typography.fontWeight.normal,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: '0.4px',
    scale: '1',
  },
  overline: {
    fontSize: cssVariableTheme.typography.fontSize.xs,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: cssVariableTheme.typography.letterSpacing.widest,
    textTransform: 'uppercase',
    scale: '1',
  },
}

const colorToVar = (color: TypographyColor): string => {
  if (color === 'textPrimary') return cssVariableTheme.text.primary
  if (color === 'textSecondary') return cssVariableTheme.text.secondary
  if (color === 'textDisabled') return cssVariableTheme.text.disabled
  return paletteMainColors[color].main
}

const variantToTag = (variant: TypographyVariant): string => {
  if (variant.startsWith('h')) return variant
  if (variant === 'subtitle1' || variant === 'subtitle2') return 'h6'
  if (variant === 'body1' || variant === 'body2') return 'p'
  return 'span'
}

/**
 * Typography component for consistent text styling.
 * Maps variants to semantic HTML tags and uses theme typography tokens.
 */
export const Typography = Shade<TypographyProps>({
  shadowDomName: 'shade-typography',
  css: {
    display: 'block',
    margin: '0',
    padding: '0',
    fontFamily: cssVariableTheme.typography.fontFamily,
    color: 'var(--typo-color)',

    // Gutter bottom
    '&[data-gutter-bottom]': {
      marginBottom: '0.35em',
    },

    // Alignment
    '&[data-align="left"]': { textAlign: 'left' },
    '&[data-align="center"]': { textAlign: 'center' },
    '&[data-align="right"]': { textAlign: 'right' },
    '&[data-align="justify"]': { textAlign: 'justify' },

    // Inner tag resets
    '& .typo-inner': {
      margin: '0',
      padding: '0',
      font: 'inherit',
      color: 'inherit',
      letterSpacing: 'inherit',
      textTransform: 'inherit',
    },

    // Ellipsis: single line
    '&[data-ellipsis="true"] .typo-inner': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    // Ellipsis: multi-line (webkit-box-orient applied inline in render)
    '&[data-ellipsis="multiline"] .typo-inner': {
      overflow: 'hidden',
      display: '-webkit-box',
    },

    // Copy button
    '& .typo-copy-btn': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      color: cssVariableTheme.text.secondary,
      cursor: 'pointer',
      padding: `0 ${cssVariableTheme.spacing.xs}`,
      fontSize: '0.85em',
      lineHeight: '1',
      verticalAlign: 'middle',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      transition: buildTransition(
        ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },
    '& .typo-copy-btn:hover': {
      color: cssVariableTheme.text.primary,
      background: cssVariableTheme.action.hoverBackground,
    },
  },
  render: ({ props, children, element }) => {
    const { variant = 'body1', color = 'textPrimary', ellipsis, copyable, gutterBottom, align, style } = props

    // Set color CSS variable
    element.style.setProperty('--typo-color', colorToVar(color))

    // Apply variant styles
    const vs = variantStyles[variant]
    element.style.fontSize = vs.fontSize
    element.style.fontWeight = vs.fontWeight
    element.style.lineHeight = vs.lineHeight
    element.style.letterSpacing = vs.letterSpacing
    if (vs.textTransform) {
      element.style.textTransform = vs.textTransform
    } else {
      element.style.textTransform = ''
    }
    if (vs.scale && vs.scale !== '1') {
      element.style.transformOrigin = 'left top'
      element.style.transform = `scale(${vs.scale})`
      element.style.marginBottom = `calc((${vs.scale} - 1) * 1em)`
    } else {
      element.style.transform = ''
      element.style.transformOrigin = ''
    }

    // Data attributes
    if (gutterBottom) {
      element.setAttribute('data-gutter-bottom', '')
    } else {
      element.removeAttribute('data-gutter-bottom')
    }

    if (align) {
      element.setAttribute('data-align', align)
    } else {
      element.removeAttribute('data-align')
    }

    if (ellipsis === true) {
      element.setAttribute('data-ellipsis', 'true')
    } else if (typeof ellipsis === 'number') {
      element.setAttribute('data-ellipsis', 'multiline')
    } else {
      element.removeAttribute('data-ellipsis')
    }

    element.setAttribute('data-variant', variant)

    if (style) {
      Object.assign(element.style, style)
    }

    const tag = variantToTag(variant)

    const handleCopy = () => {
      const text = element.textContent ?? ''
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback: do nothing on copy failure
      })
    }

    const inner = children
      ? createComponent(tag, { className: 'typo-inner' }, ...children)
      : createComponent(tag, { className: 'typo-inner' })

    if (typeof ellipsis === 'number') {
      const innerEl = inner as HTMLElement
      innerEl.style.setProperty('-webkit-line-clamp', String(ellipsis))
      innerEl.style.setProperty('-webkit-box-orient', 'vertical')
    }

    return (
      <>
        {inner}
        {copyable ? (
          <button type="button" className="typo-copy-btn" onclick={handleCopy} title="Copy to clipboard">
            📋
          </button>
        ) : null}
      </>
    )
  },
})
