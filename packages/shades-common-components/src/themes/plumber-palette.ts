import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Super Mario universe.
 * Nintendo red primary, Mario blue secondary,
 * with bright, cheerful tones for semantic colors.
 */
export const plumberPalette: Palette = {
  primary: {
    light: '#ff4040',
    lightContrast: '#ffffff',
    main: '#e60012',
    mainContrast: '#ffffff',
    dark: '#b0000e',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#5090e0',
    lightContrast: '#ffffff',
    main: '#2060c0',
    mainContrast: '#ffffff',
    dark: '#104090',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#ff5252',
    lightContrast: '#ffffff',
    main: '#d32f2f',
    mainContrast: '#ffffff',
    dark: '#a02020',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#ffca28',
    lightContrast: '#000000',
    main: '#f9a825',
    mainContrast: '#000000',
    dark: '#c48800',
    darkContrast: '#000000',
  },
  success: {
    light: '#60d060',
    lightContrast: '#000000',
    main: '#2e9e2e',
    mainContrast: '#ffffff',
    dark: '#1b7a1b',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#64b5f6',
    lightContrast: '#000000',
    main: '#2196f3',
    mainContrast: '#ffffff',
    dark: '#1565c0',
    darkContrast: '#ffffff',
  },
}
