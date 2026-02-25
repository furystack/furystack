import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Mass Effect UI.
 * Omni-tool orange primary, tech blue secondary,
 * with vivid sci-fi tones for semantic colors.
 */
export const shadowBrokerPalette: Palette = {
  primary: {
    light: '#ff9a40',
    lightContrast: '#000000',
    main: '#ff6d00',
    mainContrast: '#000000',
    dark: '#c45400',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#60a8ff',
    lightContrast: '#000000',
    main: '#3080e0',
    mainContrast: '#ffffff',
    dark: '#1a5ab0',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#ff5c5c',
    lightContrast: '#000000',
    main: '#e02020',
    mainContrast: '#ffffff',
    dark: '#a01818',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#ffc44a',
    lightContrast: '#000000',
    main: '#ffa800',
    mainContrast: '#000000',
    dark: '#c48200',
    darkContrast: '#000000',
  },
  success: {
    light: '#50e888',
    lightContrast: '#000000',
    main: '#20c858',
    mainContrast: '#000000',
    dark: '#109840',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#70b8ff',
    lightContrast: '#000000',
    main: '#4090e0',
    mainContrast: '#000000',
    dark: '#2068b8',
    darkContrast: '#ffffff',
  },
}
