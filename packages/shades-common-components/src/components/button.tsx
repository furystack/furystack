import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import type { Palette } from '../services/theme-provider-service.js'

export type ButtonProps = PartialElement<HTMLButtonElement> & {
  variant?: 'contained' | 'outlined'
  color?: keyof Palette
}

// Color mappings for each palette color
const colorMap: Record<
  keyof Palette,
  { main: string; mainContrast: string; light: string; dark: string; darkContrast: string }
> = {
  primary: {
    main: cssVariableTheme.palette.primary.main,
    mainContrast: cssVariableTheme.palette.primary.mainContrast,
    light: cssVariableTheme.palette.primary.light,
    dark: cssVariableTheme.palette.primary.dark,
    darkContrast: cssVariableTheme.palette.primary.darkContrast,
  },
  secondary: {
    main: cssVariableTheme.palette.secondary.main,
    mainContrast: cssVariableTheme.palette.secondary.mainContrast,
    light: cssVariableTheme.palette.secondary.light,
    dark: cssVariableTheme.palette.secondary.dark,
    darkContrast: cssVariableTheme.palette.secondary.darkContrast,
  },
  error: {
    main: cssVariableTheme.palette.error.main,
    mainContrast: cssVariableTheme.palette.error.mainContrast,
    light: cssVariableTheme.palette.error.light,
    dark: cssVariableTheme.palette.error.dark,
    darkContrast: cssVariableTheme.palette.error.darkContrast,
  },
  warning: {
    main: cssVariableTheme.palette.warning.main,
    mainContrast: cssVariableTheme.palette.warning.mainContrast,
    light: cssVariableTheme.palette.warning.light,
    dark: cssVariableTheme.palette.warning.dark,
    darkContrast: cssVariableTheme.palette.warning.darkContrast,
  },
  success: {
    main: cssVariableTheme.palette.success.main,
    mainContrast: cssVariableTheme.palette.success.mainContrast,
    light: cssVariableTheme.palette.success.light,
    dark: cssVariableTheme.palette.success.dark,
    darkContrast: cssVariableTheme.palette.success.darkContrast,
  },
  info: {
    main: cssVariableTheme.palette.info.main,
    mainContrast: cssVariableTheme.palette.info.mainContrast,
    light: cssVariableTheme.palette.info.light,
    dark: cssVariableTheme.palette.info.dark,
    darkContrast: cssVariableTheme.palette.info.darkContrast,
  },
}

// Default colors when no color prop is specified
const defaultColors = {
  main: cssVariableTheme.text.secondary,
  mainContrast: cssVariableTheme.background.default,
  light: cssVariableTheme.text.primary,
  dark: cssVariableTheme.button.disabledBackground,
  darkContrast: cssVariableTheme.text.primary,
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
    margin: cssVariableTheme.spacing.sm,
    padding: `${cssVariableTheme.spacing.sm} 20px`,
    border: 'none',
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    textTransform: 'uppercase',
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    letterSpacing: '0.5px',
    lineHeight: '1.75',
    minWidth: '64px',
    userSelect: 'none',
    cursor: 'pointer',
    boxShadow: 'none',
    background: 'transparent',
    transition: `background ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.default}, box-shadow ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.default}, color ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.default}, transform ${cssVariableTheme.transitions.duration.fast} ${cssVariableTheme.transitions.easing.easeOut}, opacity ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.default}`,

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
    element.style.setProperty('--btn-color-main-contrast', colors.mainContrast)
    element.style.setProperty('--btn-color-light', colors.light)
    element.style.setProperty('--btn-color-dark', colors.dark)
    element.style.setProperty('--btn-color-dark-contrast', colors.darkContrast)

    // Apply any custom styles from props
    if (props.style) {
      Object.assign(element.style, props.style)
    }

    return <>{children}</>
  },
})
