import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import type { Palette } from '../services/theme-provider-service.js'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export type ButtonProps = PartialElement<HTMLButtonElement> & {
  variant?: 'contained' | 'outlined'
  color?: keyof Palette
}

// Color mappings for each palette color
const colorMap: Record<keyof Palette, { main: string; light: string; dark: string }> = {
  primary: {
    main: cssVariableTheme.palette.primary.main,
    light: cssVariableTheme.palette.primary.light,
    dark: cssVariableTheme.palette.primary.dark,
  },
  secondary: {
    main: cssVariableTheme.palette.secondary.main,
    light: cssVariableTheme.palette.secondary.light,
    dark: cssVariableTheme.palette.secondary.dark,
  },
  error: {
    main: cssVariableTheme.palette.error.main,
    light: cssVariableTheme.palette.error.light,
    dark: cssVariableTheme.palette.error.dark,
  },
  warning: {
    main: cssVariableTheme.palette.warning.main,
    light: cssVariableTheme.palette.warning.light,
    dark: cssVariableTheme.palette.warning.dark,
  },
  success: {
    main: cssVariableTheme.palette.success.main,
    light: cssVariableTheme.palette.success.light,
    dark: cssVariableTheme.palette.success.dark,
  },
  info: {
    main: cssVariableTheme.palette.info.main,
    light: cssVariableTheme.palette.info.light,
    dark: cssVariableTheme.palette.info.dark,
  },
}

// Default colors when no color prop is specified
const defaultColors = {
  main: cssVariableTheme.text.secondary,
  light: cssVariableTheme.text.primary,
  dark: cssVariableTheme.button.disabledBackground,
}

export const Button = Shade<ButtonProps>({
  shadowDomName: 'shade-button',
  elementBase: HTMLButtonElement,
  elementBaseName: 'button',
  css: {
    // Base styles (layout, typography)
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '8px',
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    textTransform: 'uppercase',
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '0.5px',
    lineHeight: '1.75',
    minWidth: '64px',
    userSelect: 'none',
    cursor: 'pointer',
    boxShadow: 'none',
    background: 'transparent',
    transition:
      'background 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s cubic-bezier(0.230, 1.000, 0.320, 1.000), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

    // Common states
    '&:active:not(:disabled)': {
      transform: 'scale(0.96)',
    },

    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.6',
    },

    // ==========================================
    // FLAT VARIANT (default - no data-variant)
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
      color: cssVariableTheme.background.default,
    },

    '&[data-variant="contained"]:hover:not(:disabled)': {
      background: 'var(--btn-color-dark)',
    },

    '&[data-variant="contained"]:disabled': {
      background: 'var(--btn-color-dark)',
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
  },
  render: ({ props, children, element }) => {
    // Set data attributes for CSS styling
    if (props.variant) {
      element.setAttribute('data-variant', props.variant)
    } else {
      element.removeAttribute('data-variant')
    }

    // Set CSS custom properties for the button colors
    const colors = props.color ? colorMap[props.color] : defaultColors
    element.style.setProperty('--btn-color-main', colors.main)
    element.style.setProperty('--btn-color-light', colors.light)
    element.style.setProperty('--btn-color-dark', colors.dark)

    // Apply any custom styles from props
    if (props.style) {
      Object.assign(element.style, props.style)
    }

    return <>{children}</>
  },
})
