import type { DeepPartial } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { defaultDarkTheme } from '../themes/default-dark-theme.js'
import { defaultLightTheme } from '../themes/default-light-theme.js'
import { jediTheme } from '../themes/jedi-theme.js'
import { wildHuntTheme } from '../themes/wild-hunt-theme.js'
import { getThemeMode } from './get-theme-mode.js'
import type { Theme } from './theme-provider-service.js'

describe('getThemeMode', () => {
  describe('Throwing errors', () => {
    it('Should throw for missing background color', () => {
      const theme: DeepPartial<Theme> = {
        text: {
          primary: '#FFF',
        },
      }

      expect(() => getThemeMode(theme)).toThrowErrorMatchingInlineSnapshot(
        `[Error: Cannot determine the theme mode for theme "undefined" - Maybe background color or text color is missing, or cannot be recognized?]`,
      )
    })

    it('Should throw for missing text color', () => {
      const theme: DeepPartial<Theme> = {
        background: {
          default: '#fff',
        },
      }

      expect(() => getThemeMode(theme)).toThrowErrorMatchingInlineSnapshot(
        `[Error: Cannot determine the theme mode for theme "undefined" - Maybe background color or text color is missing, or cannot be recognized?]`,
      )
    })

    it('Should throw for unrecognizable background color', () => {
      const theme: DeepPartial<Theme> = {
        background: {
          default: "I'm not a color, hey",
        },
        text: {
          primary: '#fff',
        },
      }

      expect(() => getThemeMode(theme)).toThrowErrorMatchingInlineSnapshot(
        `[Error: Color format 'I'm not a color, hey' is not supported.]`,
      )
    })
  })

  describe('Light themes', () => {
    it('identifies the default light theme', () => {
      expect(getThemeMode(defaultLightTheme)).toBe('light')
    })

    it('identifies the default dark', () => {
      expect(getThemeMode(defaultDarkTheme)).toBe('dark')
    })

    it('identifies the witcher theme', () => {
      expect(getThemeMode(wildHuntTheme)).toBe('dark')
    })

    it('identifies the jedi theme', () => {
      expect(getThemeMode(jediTheme)).toBe('light')
    })
  })
})
