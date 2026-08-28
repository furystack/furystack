import { describe, expect, it, vi } from 'vitest'

import type { Theme } from '@furystack/shades-common-components'
import type { DeepPartial } from '@furystack/utils'

import { createMonacoTheme } from './create-monaco-theme.js'

const darkTheme: DeepPartial<Theme> = {
  background: { default: '#1a1a2e' },
  text: { primary: '#e0e0e0', secondary: '#a0a0a0', disabled: '#606060' },
  palette: {
    primary: { main: '#4fc3f7' },
    error: { main: '#ef5350' },
    warning: { main: '#ffa726' },
    info: { main: '#29b6f6' },
    success: { main: '#66bb6a' },
  },
  action: { selectedBackground: '#2a2a4e', hoverBackground: '#3a3a5e' },
  divider: '#444466',
}

const lightTheme: DeepPartial<Theme> = {
  background: { default: '#ffffff' },
  text: { primary: '#212121' },
  palette: { primary: { main: '#1976d2' } },
}

describe('createMonacoTheme', () => {
  describe('theme structure', () => {
    it('should return name and data properties', () => {
      const result = createMonacoTheme(darkTheme)
      expect(result.name).toBe('shades-theme')
      expect(result.data).toBeDefined()
      expect(result.data.inherit).toBe(true)
      expect(result.data.rules).toEqual([])
    })
  })

  describe('base theme selection', () => {
    it('should use vs-dark for dark backgrounds', () => {
      const result = createMonacoTheme(darkTheme)
      expect(result.data.base).toBe('vs-dark')
    })

    it('should use vs for light backgrounds', () => {
      const result = createMonacoTheme(lightTheme)
      expect(result.data.base).toBe('vs')
    })

    it('should default to vs-dark when no background is provided', () => {
      const result = createMonacoTheme({})
      expect(result.data.base).toBe('vs-dark')
    })
  })

  describe('color mapping', () => {
    it('should map background and foreground colors', () => {
      const result = createMonacoTheme(darkTheme)
      expect(result.data.colors['editor.background']).toBe('#1a1a2e')
      expect(result.data.colors['editor.foreground']).toBe('#e0e0e0')
    })

    it('should map line number colors', () => {
      const result = createMonacoTheme(darkTheme)
      expect(result.data.colors['editorLineNumber.foreground']).toBe('#a0a0a0')
      expect(result.data.colors['editorLineNumber.activeForeground']).toBe('#e0e0e0')
      expect(result.data.colors['editorLineNumber.dimmedForeground']).toBe('#606060')
    })

    it('should map error/warning/info/hint colors', () => {
      const result = createMonacoTheme(darkTheme)
      expect(result.data.colors['editorError.foreground']).toBe('#ef5350')
      expect(result.data.colors['editorWarning.foreground']).toBe('#ffa726')
      expect(result.data.colors['editorInfo.foreground']).toBe('#29b6f6')
      expect(result.data.colors['editorHint.foreground']).toBe('#66bb6a')
    })

    it('should map widget colors from paper background', () => {
      const theme: DeepPartial<Theme> = {
        background: { default: '#1a1a2e', paper: '#2a2a3e' },
        text: { primary: '#ffffff' },
        divider: '#555577',
      }
      const result = createMonacoTheme(theme)
      expect(result.data.colors['editorWidget.background']).toBe('#2a2a3e')
      expect(result.data.colors['editorWidget.foreground']).toBe('#ffffff')
      expect(result.data.colors['editorWidget.border']).toBe('#555577')
    })
  })

  describe('alpha channel handling', () => {
    it('should apply alpha to selection colors', () => {
      const result = createMonacoTheme(darkTheme)
      const selectionBg = result.data.colors['editor.selectionBackground']
      expect(selectionBg).toBeDefined()
      expect(selectionBg).toMatch(/^#[0-9a-f]{8}$/i)
      expect(selectionBg.slice(7)).toBe('59')
    })

    it('should apply alpha to scrollbar colors', () => {
      const result = createMonacoTheme(darkTheme)
      const scrollbar = result.data.colors['scrollbarSlider.background']
      expect(scrollbar).toBeDefined()
      expect(scrollbar).toMatch(/^#[0-9a-f]{8}$/i)
      expect(scrollbar.slice(7)).toBe('33')
    })
  })

  describe('missing theme values', () => {
    it('should skip undefined color mappings', () => {
      const result = createMonacoTheme({})
      expect(result.data.colors['editor.background']).toBeUndefined()
      expect(result.data.colors['editor.foreground']).toBeUndefined()
      expect(result.data.colors['editorCursor.foreground']).toBeUndefined()
    })

    it('should only include colors for provided theme tokens', () => {
      const minimal: DeepPartial<Theme> = {
        background: { default: '#000000' },
        text: { primary: '#ffffff' },
      }
      const result = createMonacoTheme(minimal)
      expect(result.data.colors['editor.background']).toBe('#000000')
      expect(result.data.colors['editor.foreground']).toBe('#ffffff')
      expect(result.data.colors['editorCursor.foreground']).toBeUndefined()
      expect(result.data.colors['editorError.foreground']).toBeUndefined()
    })
  })

  describe('unresolvable colors', () => {
    it('should skip colors that throw during conversion', () => {
      const theme: DeepPartial<Theme> = {
        background: { default: '#1a1a2e' },
        text: { primary: 'bad-color' },
      }
      const result = createMonacoTheme(theme)
      expect(result.data.colors['editor.foreground']).toBeUndefined()
      expect(result.data.colors['editor.background']).toBe('#1a1a2e')
    })
  })

  describe('base theme fallback', () => {
    it('should fall back to vs-dark and warn when getTextColor throws', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const theme: DeepPartial<Theme> = {
        background: { default: 'not-a-color' },
      }
      const result = createMonacoTheme(theme)
      expect(result.data.base).toBe('vs-dark')
      expect(warnSpy).toHaveBeenCalledOnce()
      warnSpy.mockRestore()
    })
  })
})
