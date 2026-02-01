import type { Palette } from './theme-provider-service.js'

/**
 * Default color palette with semantic colors for the application.
 * Contrast colors are calculated based on WCAG contrast guidelines.
 */
export const defaultPalette: Palette = {
  primary: {
    light: '#6573c3',
    lightContrast: '#ffffff',
    main: '#3f51b5',
    mainContrast: '#ffffff',
    dark: '#2c387e',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#4aedc4',
    lightContrast: '#000000',
    main: '#1de9b6',
    mainContrast: '#000000',
    dark: '#14a37f',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#e57373',
    lightContrast: '#000000',
    main: '#f44336',
    mainContrast: '#ffffff',
    dark: '#a31f1f',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#ffb74d',
    lightContrast: '#000000',
    main: '#ff9800',
    mainContrast: '#000000',
    dark: '#f57c00',
    darkContrast: '#000000',
  },
  info: {
    light: '#64b5f6',
    lightContrast: '#000000',
    main: '#2196f3',
    mainContrast: '#ffffff',
    dark: '#1976d2',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#81c784',
    lightContrast: '#000000',
    main: '#4caf50',
    mainContrast: '#000000',
    dark: '#388e3c',
    darkContrast: '#ffffff',
  },
}
