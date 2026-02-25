import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Star Wars Sith Order.
 * Crimson lightsaber red primary, dark side violet secondary,
 * with aggressive, high-contrast tones for semantic colors.
 */
export const sithPalette: Palette = {
  primary: {
    light: '#e84848',
    lightContrast: '#000000',
    main: '#cc2020',
    mainContrast: '#ffffff',
    dark: '#961414',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#9a6cc4',
    lightContrast: '#000000',
    main: '#7844a8',
    mainContrast: '#ffffff',
    dark: '#582e82',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#f06060',
    lightContrast: '#000000',
    main: '#d43838',
    mainContrast: '#ffffff',
    dark: '#a02020',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#e0a040',
    lightContrast: '#000000',
    main: '#c88020',
    mainContrast: '#000000',
    dark: '#986010',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#60a868',
    lightContrast: '#000000',
    main: '#408848',
    mainContrast: '#ffffff',
    dark: '#286830',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#7888b0',
    lightContrast: '#000000',
    main: '#586896',
    mainContrast: '#ffffff',
    dark: '#3a4a78',
    darkContrast: '#ffffff',
  },
}
