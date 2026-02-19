import { cssVariableTheme } from '../services/css-variable-theme.js'

declare global {
  interface CSSStyleDeclaration {
    backdropFilter: string
    fieldSizing: string
  }
}

const glassBox: Partial<CSSStyleDeclaration> = {
  backdropFilter: `blur(${cssVariableTheme.effects.blurSm})`,
  borderRadius: cssVariableTheme.shape.borderRadius.sm,
  border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
  boxShadow: cssVariableTheme.shadows.md,
}

export const colors = {
  primary: {
    light: cssVariableTheme.palette.primary.light,
    main: cssVariableTheme.palette.primary.main,
    dark: cssVariableTheme.palette.primary.dark,
    contrastText: cssVariableTheme.palette.primary.mainContrast,
  },
  secondary: {
    light: cssVariableTheme.palette.secondary.light,
    main: cssVariableTheme.palette.secondary.main,
    dark: cssVariableTheme.palette.secondary.dark,
    contrastText: cssVariableTheme.palette.secondary.mainContrast,
  },
  error: {
    main: cssVariableTheme.palette.error.main,
  },
}

export const styles = {
  glassBox,
}
