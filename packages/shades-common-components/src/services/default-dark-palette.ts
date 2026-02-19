import type { Palette } from './theme-provider-service.js'

/**
 * Color palette optimized for dark backgrounds (#121212).
 * Uses lighter Material Design color variants to ensure
 * WCAG AA contrast (≥4.5:1) against the dark theme background.
 */
export const defaultDarkPalette: Palette = {
  primary: {
    light: '#9fa8da',
    lightContrast: '#000000',
    main: '#7986cb',
    mainContrast: '#000000',
    dark: '#5c6bc0',
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
    light: '#ef9a9a',
    lightContrast: '#000000',
    main: '#ef5350',
    mainContrast: '#000000',
    dark: '#e53935',
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
    light: '#90caf9',
    lightContrast: '#000000',
    main: '#42a5f5',
    mainContrast: '#000000',
    dark: '#1e88e5',
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
