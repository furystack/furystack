import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteFullColors } from '../services/palette-css-vars.js'
import type { Palette } from '../services/theme-provider-service.js'

export type ButtonProps = PartialElement<HTMLButtonElement> & {
  /**
   * The visual variant of the button.
   * - 'contained': solid background color
   * - 'outlined': border with transparent background
   * - 'text': no background or border (default behavior)
   */
  variant?: 'contained' | 'outlined' | 'text'
  /** The palette color for the button */
  color?: keyof Palette
  /**
   * The size of the button.
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
  /** When true, applies the error palette color regardless of the `color` prop */
  danger?: boolean
  /** When true, shows a loading spinner and disables the button */
  loading?: boolean
  /** An element rendered before the button label */
  startIcon?: JSX.Element
  /** An element rendered after the button label */
  endIcon?: JSX.Element
}

// Default colors when no color prop is specified
const defaultColors = {
  main: cssVariableTheme.text.secondary,
  mainContrast: cssVariableTheme.background.default,
  light: cssVariableTheme.text.primary,
  dark: cssVariableTheme.button.disabledBackground,
  darkContrast: cssVariableTheme.text.primary,
}

const ensureSpinnerKeyframes = () => {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-shades-button-spinner]')) return
  const style = document.createElement('style')
  style.setAttribute('data-shades-button-spinner', '')
  style.textContent = '@keyframes shade-btn-spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(style)
}

const spinnerStyle: Partial<CSSStyleDeclaration> = {
  display: 'inline-block',
  width: '1em',
  height: '1em',
  border: '2px solid currentColor',
  borderRightColor: 'transparent',
  borderRadius: cssVariableTheme.shape.borderRadius.full,
  animation: 'shade-btn-spin 0.75s linear infinite',
  flexShrink: '0',
}

const iconWrapperStyle: Partial<CSSStyleDeclaration> = {
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: '0',
}

export const Button = Shade<ButtonProps>({
  tagName: 'shade-button',
  elementBase: HTMLButtonElement,
  elementBaseName: 'button',
  css: {
    // Base styles (layout, typography)
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: cssVariableTheme.spacing.xs,
    margin: cssVariableTheme.spacing.sm,
    padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.lg}`,
    border: 'none',
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    textTransform: 'uppercase',
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wider,
    lineHeight: '1.75',
    minWidth: '64px',
    userSelect: 'none',
    cursor: 'pointer',
    boxShadow: 'none',
    background: 'transparent',
    transition: buildTransition(
      ['background', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
      ['box-shadow', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
      ['color', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
      ['transform', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.easeOut],
      ['opacity', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
    ),

    // Common states
    '&:active:not(:disabled)': {
      transform: 'scale(0.96)',
    },

    '&:disabled': {
      cursor: 'not-allowed',
      opacity: cssVariableTheme.action.disabledOpacity,
    },

    // ==========================================
    // FLAT / TEXT VARIANT (default - no data-variant)
    // Uses CSS custom properties set in render
    // ==========================================

    color: 'var(--btn-color-main)',

    '&:not([data-variant]):hover:not(:disabled)': {
      color: 'var(--btn-color-light)',
      background: 'color-mix(in srgb, var(--btn-color-main) 10%, transparent)',
    },

    '&:not([data-variant]):disabled': {
      color: 'var(--btn-color-dark)',
    },

    // ==========================================
    // CONTAINED VARIANT
    // ==========================================

    '&[data-variant="contained"]': {
      background: 'var(--btn-color-main)',
      color: 'var(--btn-color-main-contrast)',
    },

    '&[data-variant="contained"]:hover:not(:disabled)': {
      background: 'var(--btn-color-dark)',
      color: 'var(--btn-color-dark-contrast)',
    },

    '&[data-variant="contained"]:disabled': {
      background: 'var(--btn-color-dark)',
      color: 'var(--btn-color-dark-contrast)',
    },

    // ==========================================
    // OUTLINED VARIANT
    // ==========================================

    '&[data-variant="outlined"]': {
      color: 'var(--btn-color-main)',
      boxShadow: '0px 0px 0px 1px var(--btn-color-main)',
      backdropFilter: 'blur(35px)',
    },

    '&[data-variant="outlined"]:hover:not(:disabled)': {
      color: 'var(--btn-color-light)',
      boxShadow: '0px 0px 0px 1px var(--btn-color-light)',
      background: 'color-mix(in srgb, var(--btn-color-main) 10%, transparent)',
    },

    '&[data-variant="outlined"]:disabled': {
      color: 'var(--btn-color-dark)',
      boxShadow: '0px 0px 0px 1px var(--btn-color-dark)',
    },

    // ==========================================
    // SIZE VARIANTS
    // ==========================================

    '&[data-size="small"]': {
      padding: `${cssVariableTheme.spacing.xs} ${cssVariableTheme.spacing.sm}`,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      minWidth: '48px',
    },

    '&[data-size="large"]': {
      padding: `${cssVariableTheme.spacing.md} ${cssVariableTheme.spacing.xl}`,
      fontSize: cssVariableTheme.typography.fontSize.lg,
      minWidth: '80px',
    },

    // ==========================================
    // LOADING STATE
    // ==========================================

    '&[data-loading]': {
      cursor: 'default',
      pointerEvents: 'none',
      opacity: '0.7',
    },
  },
  render: ({ props, children, element }) => {
    // Set data attributes for CSS styling
    if (props.variant && props.variant !== 'text') {
      element.setAttribute('data-variant', props.variant)
    } else {
      element.removeAttribute('data-variant')
    }

    // Handle size
    if (props.size && props.size !== 'medium') {
      element.setAttribute('data-size', props.size)
    } else {
      element.removeAttribute('data-size')
    }

    // Handle loading
    if (props.loading) {
      element.setAttribute('data-loading', '')
      element.setAttribute('disabled', '')
      ensureSpinnerKeyframes()
    } else {
      element.removeAttribute('data-loading')
    }

    // Danger overrides color to error
    const effectiveColor = props.danger ? 'error' : props.color

    // Set CSS custom properties for the button colors
    const colors = effectiveColor ? paletteFullColors[effectiveColor] : defaultColors
    element.style.setProperty('--btn-color-main', colors.main)
    element.style.setProperty('--btn-color-main-contrast', colors.mainContrast)
    element.style.setProperty('--btn-color-light', colors.light)
    element.style.setProperty('--btn-color-dark', colors.dark)
    element.style.setProperty('--btn-color-dark-contrast', colors.darkContrast)

    // Apply any custom styles from props
    if (props.style) {
      Object.assign(element.style, props.style)
    }

    return (
      <>
        {props.loading ? (
          <span style={spinnerStyle} className="shade-btn-spinner" />
        ) : props.startIcon ? (
          <span style={iconWrapperStyle} className="shade-btn-start-icon">
            {props.startIcon}
          </span>
        ) : null}
        {children}
        {!props.loading && props.endIcon ? (
          <span style={iconWrapperStyle} className="shade-btn-end-icon">
            {props.endIcon}
          </span>
        ) : null}
      </>
    )
  },
})
