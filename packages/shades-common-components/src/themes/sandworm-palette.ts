import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Dune universe.
 * Spice-orange primary, "eyes of Ibad" blue secondary,
 * with warm desert tones for semantic colors.
 */
export const sandwormPalette: Palette = {
  primary: {
    light: '#e8a030',
    lightContrast: '#000000',
    main: '#d4820a',
    mainContrast: '#000000',
    dark: '#a06008',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#4090c8',
    lightContrast: '#ffffff',
    main: '#2068a0',
    mainContrast: '#ffffff',
    dark: '#104878',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#c85050',
    lightContrast: '#000000',
    main: '#a83030',
    mainContrast: '#ffffff',
    dark: '#782020',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#d8a840',
    lightContrast: '#000000',
    main: '#c09020',
    mainContrast: '#000000',
    dark: '#906c18',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#68a060',
    lightContrast: '#000000',
    main: '#488040',
    mainContrast: '#ffffff',
    dark: '#306028',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#5098c0',
    lightContrast: '#000000',
    main: '#3078a0',
    mainContrast: '#ffffff',
    dark: '#205878',
    darkContrast: '#ffffff',
  },
}
