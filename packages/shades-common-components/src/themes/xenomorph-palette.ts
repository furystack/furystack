import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Alien franchise.
 * Acid green primary, cold industrial steel-blue secondary,
 * with harsh, clinical tones for semantic colors.
 */
export const xenomorphPalette: Palette = {
  primary: {
    light: '#a0e070',
    lightContrast: '#000000',
    main: '#7ec850',
    mainContrast: '#000000',
    dark: '#5a9830',
    darkContrast: '#000000',
  },
  secondary: {
    light: '#8898b0',
    lightContrast: '#000000',
    main: '#607890',
    mainContrast: '#ffffff',
    dark: '#425868',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#e05858',
    lightContrast: '#000000',
    main: '#c43030',
    mainContrast: '#ffffff',
    dark: '#901c1c',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#d0a040',
    lightContrast: '#000000',
    main: '#b08020',
    mainContrast: '#000000',
    dark: '#886010',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#68b868',
    lightContrast: '#000000',
    main: '#489848',
    mainContrast: '#000000',
    dark: '#2e7830',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#6890b8',
    lightContrast: '#000000',
    main: '#487098',
    mainContrast: '#ffffff',
    dark: '#2e5078',
    darkContrast: '#ffffff',
  },
}
