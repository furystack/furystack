import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export type DividerProps = PartialElement<HTMLElement> & {
  /** Orientation of the divider */
  orientation?: 'horizontal' | 'vertical'
  /** Variant controls whether the divider spans the full width/height or is inset */
  variant?: 'full' | 'inset' | 'middle'
  /** Alignment of text content within the divider. Only applies to horizontal dividers with children. */
  textAlign?: 'left' | 'center' | 'right'
}

export const Divider = Shade<DividerProps>({
  tagName: 'shade-divider',
  css: {
    display: 'flex',
    alignItems: 'center',
    margin: '0',
    border: 'none',
    flexShrink: '0',

    // ==========================================
    // HORIZONTAL (default)
    // ==========================================

    '&:not([data-orientation="vertical"])': {
      width: '100%',
      flexDirection: 'row',
    },

    // Horizontal line (no children)
    '&:not([data-orientation="vertical"]):not([data-has-children])': {
      borderTop: `1px solid ${cssVariableTheme.divider}`,
      margin: `${cssVariableTheme.spacing.md} 0`,
    },

    // Horizontal with children: lines on both sides
    '&:not([data-orientation="vertical"])[data-has-children]': {
      margin: `${cssVariableTheme.spacing.md} 0`,
      gap: cssVariableTheme.spacing.md,
    },

    '&:not([data-orientation="vertical"])[data-has-children]::before, &:not([data-orientation="vertical"])[data-has-children]::after':
      {
        content: '""',
        flex: '1',
        borderTop: `1px solid ${cssVariableTheme.divider}`,
      },

    // Text align left: shrink left line
    '&[data-text-align="left"]::before': {
      flex: '0 0 10%',
    },

    // Text align right: shrink right line
    '&[data-text-align="right"]::after': {
      flex: '0 0 10%',
    },

    // Divider text styling
    '& .divider-text': {
      fontFamily: cssVariableTheme.typography.fontFamily,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      color: cssVariableTheme.text.secondary,
      whiteSpace: 'nowrap',
      lineHeight: '1',
    },

    // ==========================================
    // VERTICAL
    // ==========================================

    '&[data-orientation="vertical"]': {
      flexDirection: 'column',
      alignSelf: 'stretch',
      height: 'auto',
      width: 'auto',
    },

    // Vertical line (no children)
    '&[data-orientation="vertical"]:not([data-has-children])': {
      borderLeft: `1px solid ${cssVariableTheme.divider}`,
      margin: `0 ${cssVariableTheme.spacing.md}`,
    },

    // Vertical with children
    '&[data-orientation="vertical"][data-has-children]': {
      margin: `0 ${cssVariableTheme.spacing.md}`,
      gap: cssVariableTheme.spacing.sm,
    },

    '&[data-orientation="vertical"][data-has-children]::before, &[data-orientation="vertical"][data-has-children]::after':
      {
        content: '""',
        flex: '1',
        borderLeft: `1px solid ${cssVariableTheme.divider}`,
      },

    // ==========================================
    // VARIANT: INSET (indented on the start side)
    // ==========================================

    '&:not([data-orientation="vertical"])[data-variant="inset"]': {
      marginLeft: cssVariableTheme.spacing.xl,
    },

    '&[data-orientation="vertical"][data-variant="inset"]': {
      marginTop: cssVariableTheme.spacing.xl,
    },

    // ==========================================
    // VARIANT: MIDDLE (indented on both sides)
    // ==========================================

    '&:not([data-orientation="vertical"])[data-variant="middle"]': {
      marginLeft: cssVariableTheme.spacing.lg,
      marginRight: cssVariableTheme.spacing.lg,
    },

    '&[data-orientation="vertical"][data-variant="middle"]': {
      marginTop: cssVariableTheme.spacing.lg,
      marginBottom: cssVariableTheme.spacing.lg,
    },
  },
  render: ({ props, children, element }) => {
    const { orientation, variant, textAlign, style } = props

    if (orientation === 'vertical') {
      element.setAttribute('data-orientation', 'vertical')
      element.setAttribute('role', 'separator')
      element.setAttribute('aria-orientation', 'vertical')
    } else {
      element.removeAttribute('data-orientation')
      element.setAttribute('role', 'separator')
    }

    if (variant && variant !== 'full') {
      element.setAttribute('data-variant', variant)
    } else {
      element.removeAttribute('data-variant')
    }

    const hasChildren = children && (Array.isArray(children) ? children.length > 0 : true)

    if (hasChildren) {
      element.setAttribute('data-has-children', '')
    } else {
      element.removeAttribute('data-has-children')
    }

    if (textAlign && textAlign !== 'center') {
      element.setAttribute('data-text-align', textAlign)
    } else {
      element.removeAttribute('data-text-align')
    }

    if (style) {
      Object.assign(element.style, style)
    }

    if (hasChildren) {
      return <span className="divider-text">{children}</span>
    }

    return <></>
  },
})
