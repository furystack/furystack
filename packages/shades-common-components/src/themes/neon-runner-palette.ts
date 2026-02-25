import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by cyberpunk neon aesthetics.
 * Electric cyan primary, hot magenta secondary,
 * with vivid neon tones for semantic colors.
 */
export const neonRunnerPalette: Palette = {
  primary: {
    light: '#66f7ff',
    lightContrast: '#000000',
    main: '#00f0ff',
    mainContrast: '#000000',
    dark: '#00b8c4',
    darkContrast: '#000000',
  },
  secondary: {
    light: '#ff6db5',
    lightContrast: '#000000',
    main: '#ff2d95',
    mainContrast: '#000000',
    dark: '#c4006e',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#ff6680',
    lightContrast: '#000000',
    main: '#ff3860',
    mainContrast: '#000000',
    dark: '#c41840',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#ffc850',
    lightContrast: '#000000',
    main: '#ffb020',
    mainContrast: '#000000',
    dark: '#c48800',
    darkContrast: '#000000',
  },
  success: {
    light: '#50f098',
    lightContrast: '#000000',
    main: '#20e070',
    mainContrast: '#000000',
    dark: '#10a850',
    darkContrast: '#000000',
  },
  info: {
    light: '#60b0ff',
    lightContrast: '#000000',
    main: '#3090ff',
    mainContrast: '#000000',
    dark: '#1060c4',
    darkContrast: '#ffffff',
  },
}
