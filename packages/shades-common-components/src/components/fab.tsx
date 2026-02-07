import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import type { Palette } from '../services/theme-provider-service.js'

export type FabProps = PartialElement<HTMLButtonElement> & {
  color?: keyof Palette
}

// Color mappings for each palette color
const colorMap: Record<keyof Palette, { main: string; mainContrast: string; dark: string }> = {
  primary: {
    main: cssVariableTheme.palette.primary.main,
    mainContrast: cssVariableTheme.palette.primary.mainContrast,
    dark: cssVariableTheme.palette.primary.dark,
  },
  secondary: {
    main: cssVariableTheme.palette.secondary.main,
    mainContrast: cssVariableTheme.palette.secondary.mainContrast,
    dark: cssVariableTheme.palette.secondary.dark,
  },
  error: {
    main: cssVariableTheme.palette.error.main,
    mainContrast: cssVariableTheme.palette.error.mainContrast,
    dark: cssVariableTheme.palette.error.dark,
  },
  warning: {
    main: cssVariableTheme.palette.warning.main,
    mainContrast: cssVariableTheme.palette.warning.mainContrast,
    dark: cssVariableTheme.palette.warning.dark,
  },
  success: {
    main: cssVariableTheme.palette.success.main,
    mainContrast: cssVariableTheme.palette.success.mainContrast,
    dark: cssVariableTheme.palette.success.dark,
  },
  info: {
    main: cssVariableTheme.palette.info.main,
    mainContrast: cssVariableTheme.palette.info.mainContrast,
    dark: cssVariableTheme.palette.info.dark,
  },
}

export const Fab = Shade<FabProps>({
  shadowDomName: 'shade-fab',
  elementBase: HTMLButtonElement,
  elementBaseName: 'button',
  css: {
    position: 'fixed',
    bottom: cssVariableTheme.spacing.xl,
    right: cssVariableTheme.spacing.xl,
    background: 'var(--fab-color-main)',
    color: 'var(--fab-color-contrast)',
    width: '64px',
    height: '64px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: cssVariableTheme.shape.borderRadius.full,
    boxShadow: cssVariableTheme.shadows.md,
    cursor: 'pointer',
    border: 'none',
    transition: `transform ${cssVariableTheme.transitions.duration.normal} ease, box-shadow ${cssVariableTheme.transitions.duration.normal} ease, background ${cssVariableTheme.transitions.duration.normal} ease`,
    '&:hover': {
      transform: 'scale(1.05)',
      background: 'var(--fab-color-dark)',
      boxShadow: cssVariableTheme.shadows.xl,
    },
    '&:active': {
      transform: 'scale(0.95)',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.6',
    },
  },
  render: ({ props, children, element }) => {
    const colors = colorMap[props.color ?? 'primary']
    element.style.setProperty('--fab-color-main', colors.main)
    element.style.setProperty('--fab-color-contrast', colors.mainContrast)
    element.style.setProperty('--fab-color-dark', colors.dark)

    return <>{children}</>
  },
})
