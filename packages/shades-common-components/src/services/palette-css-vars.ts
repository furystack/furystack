import { cssVariableTheme } from './css-variable-theme.js'
import type { ColorVariants, Palette } from './theme-provider-service.js'

/**
 * A Record mapping every Palette key to main + mainContrast CSS variable references.
 * Shared by components that accept a `color?: keyof Palette` prop (Badge, Pagination, etc.).
 */
export const paletteMainColors: Record<keyof Palette, Pick<ColorVariants, 'main' | 'mainContrast'>> = {
  primary: {
    main: cssVariableTheme.palette.primary.main,
    mainContrast: cssVariableTheme.palette.primary.mainContrast,
  },
  secondary: {
    main: cssVariableTheme.palette.secondary.main,
    mainContrast: cssVariableTheme.palette.secondary.mainContrast,
  },
  error: {
    main: cssVariableTheme.palette.error.main,
    mainContrast: cssVariableTheme.palette.error.mainContrast,
  },
  warning: {
    main: cssVariableTheme.palette.warning.main,
    mainContrast: cssVariableTheme.palette.warning.mainContrast,
  },
  success: {
    main: cssVariableTheme.palette.success.main,
    mainContrast: cssVariableTheme.palette.success.mainContrast,
  },
  info: {
    main: cssVariableTheme.palette.info.main,
    mainContrast: cssVariableTheme.palette.info.mainContrast,
  },
}

/**
 * A Record mapping every Palette key to the full set of CSS variable references.
 * Shared by components that need light/dark variants (Chip, etc.).
 */
export const paletteFullColors: Record<keyof Palette, ColorVariants> = {
  primary: { ...cssVariableTheme.palette.primary },
  secondary: { ...cssVariableTheme.palette.secondary },
  error: { ...cssVariableTheme.palette.error },
  warning: { ...cssVariableTheme.palette.warning },
  success: { ...cssVariableTheme.palette.success },
  info: { ...cssVariableTheme.palette.info },
}
