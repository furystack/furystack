import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteMainColors } from '../services/palette-css-vars.js'
import type { Palette } from '../services/theme-provider-service.js'
import { clipboard } from './icons/icon-definitions.js'
import { Icon } from './icons/icon.js'

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

type VariantDef = {
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  textTransform?: string
  scale?: string
  marginTop?: string
  marginBottom?: string
}

const variantDefs: Record<TypographyVariant, VariantDef> = {
  h1: {
    fontSize: cssVariableTheme.typography.fontSize.xl,
    fontWeight: cssVariableTheme.typography.fontWeight.bold,
    lineHeight: cssVariableTheme.typography.lineHeight.tight,
    letterSpacing: cssVariableTheme.typography.letterSpacing.tight,
    scale: '2',
    marginBottom: '0.3em',
  },
  h2: {
    fontSize: cssVariableTheme.typography.fontSize.xl,
    fontWeight: cssVariableTheme.typography.fontWeight.bold,
    lineHeight: cssVariableTheme.typography.lineHeight.tight,
    letterSpacing: cssVariableTheme.typography.letterSpacing.dense,
    scale: '1.6',
    marginTop: '1.5em',
    marginBottom: '0.3em',
  },
  h3: {
    fontSize: cssVariableTheme.typography.fontSize.xl,
    fontWeight: cssVariableTheme.typography.fontWeight.semibold,
    lineHeight: cssVariableTheme.typography.lineHeight.tight,
    letterSpacing: cssVariableTheme.typography.letterSpacing.normal,
    scale: '1.3',
    marginTop: '1.25em',
    marginBottom: '0.25em',
  },
  h4: {
    fontSize: cssVariableTheme.typography.fontSize.lg,
    fontWeight: cssVariableTheme.typography.fontWeight.semibold,
    lineHeight: cssVariableTheme.typography.lineHeight.tight,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    scale: '1.15',
    marginTop: '1em',
    marginBottom: '0.25em',
  },
  h5: {
    fontSize: cssVariableTheme.typography.fontSize.lg,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: cssVariableTheme.typography.letterSpacing.normal,
    marginTop: '0.75em',
    marginBottom: '0.35em',
  },
  h6: {
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    scale: '1.1',
    marginTop: '0.5em',
    marginBottom: '0.2em',
  },
  subtitle1: {
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    marginBottom: '0.35em',
  },
  subtitle2: {
    fontSize: cssVariableTheme.typography.fontSize.sm,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: '0.1px',
    marginBottom: '0.25em',
  },
  body1: {
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.normal,
    lineHeight: cssVariableTheme.typography.lineHeight.relaxed,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    marginBottom: '0.75em',
  },
  body2: {
    fontSize: cssVariableTheme.typography.fontSize.sm,
    fontWeight: cssVariableTheme.typography.fontWeight.normal,
    lineHeight: cssVariableTheme.typography.lineHeight.relaxed,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wide,
    marginBottom: '0.5em',
  },
  caption: {
    fontSize: cssVariableTheme.typography.fontSize.xs,
    fontWeight: cssVariableTheme.typography.fontWeight.normal,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: '0.4px',
  },
  overline: {
    fontSize: cssVariableTheme.typography.fontSize.xs,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    letterSpacing: cssVariableTheme.typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: '0.5em',
  },
}

const buildVariantCssRules = (): Record<string, Record<string, string>> => {
  const rules: Record<string, Record<string, string>> = {}
  for (const [variant, def] of Object.entries(variantDefs)) {
    const rule: Record<string, string> = {
      fontSize: def.fontSize,
      fontWeight: def.fontWeight,
      lineHeight: def.lineHeight,
      letterSpacing: def.letterSpacing,
    }
    if (def.textTransform) {
      rule.textTransform = def.textTransform
    }
    if (def.marginTop) {
      rule.marginTop = def.marginTop
    }
    if (def.scale && def.scale !== '1') {
      rule.transformOrigin = 'left top'
      rule.transform = `scale(${def.scale})`
      rule.marginBottom = def.marginBottom
        ? `calc((${def.scale} - 1) * 1em + ${def.marginBottom})`
        : `calc((${def.scale} - 1) * 1em)`
    } else if (def.marginBottom) {
      rule.marginBottom = def.marginBottom
    }
    rules[`&[data-variant="${variant}"]`] = rule
  }
  return rules
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

    // Variant-specific typography styles
    ...buildVariantCssRules(),

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
  render: ({ props, children, useHostProps, useRef }) => {
    const { variant = 'body1', color = 'textPrimary', ellipsis, copyable, gutterBottom, align, style } = props

    const hostStyle: Record<string, string> = {
      '--typo-color': colorToVar(color),
    }
    if (style) {
      Object.assign(hostStyle, style)
    }
    useHostProps({
      'data-gutter-bottom': gutterBottom ? '' : undefined,
      'data-align': align || undefined,
      'data-ellipsis': ellipsis === true ? 'true' : typeof ellipsis === 'number' ? 'multiline' : undefined,
      'data-variant': variant,
      style: hostStyle,
    })

    const tag = variantToTag(variant)

    const innerRef = useRef<HTMLElement>('inner')
    const handleCopy = () => {
      const text = innerRef.current?.textContent ?? ''
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback: do nothing on copy failure
      })
    }

    const innerProps: Record<string, unknown> = { className: 'typo-inner', ref: innerRef }
    if (typeof ellipsis === 'number') {
      innerProps.style = { webkitLineClamp: String(ellipsis), webkitBoxOrient: 'vertical' }
    }

    const inner = children ? createComponent(tag, innerProps, ...children) : createComponent(tag, innerProps)

    return (
      <>
        {inner}
        {copyable ? (
          <button type="button" className="typo-copy-btn" onclick={handleCopy} title="Copy to clipboard">
            <Icon icon={clipboard} size={14} />
          </button>
        ) : null}
      </>
    )
  },
})
