import type { DeepPartial } from '@furystack/utils'

import type { Theme, ThemeProviderService } from '@furystack/shades-common-components'
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'

const SHADES_THEME_NAME = 'shades-theme'

const toHex = (n: number): string =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0')

const rgbToHex = (themeProvider: ThemeProviderService, color: string): string => {
  const { r, g, b, a } = themeProvider.getRgbFromColorString(color)
  const base = `#${toHex(r)}${toHex(g)}${toHex(b)}`
  return a < 1 ? `${base}${toHex(a * 255)}` : base
}

const withAlpha = (hex: string, alpha: number): string => {
  const base = hex.length === 9 ? hex.slice(0, 7) : hex
  return `${base}${toHex(alpha * 255)}`
}

/**
 * Creates a Monaco `IStandaloneThemeData` from a FuryStack Shades theme.
 * Inherits syntax highlighting from the closest built-in base (`vs` or `vs-dark`)
 * and maps Shades design tokens to Monaco editor chrome colors.
 */
export const createMonacoTheme = (
  theme: DeepPartial<Theme>,
  themeProvider: ThemeProviderService,
): { name: string; data: editor.IStandaloneThemeData } => {
  const bg = theme.background?.default
  const base: editor.BuiltinTheme = bg
    ? (themeProvider.getTextColor(bg, 'vs', 'vs-dark') as editor.BuiltinTheme)
    : 'vs-dark'

  const colors: Record<string, string> = {}

  const map = (monacoKey: string, color: string | undefined) => {
    if (!color) return
    try {
      colors[monacoKey] = rgbToHex(themeProvider, color)
    } catch {
      // skip unresolvable colors
    }
  }

  const mapWithAlpha = (monacoKey: string, color: string | undefined, alpha: number) => {
    if (!color) return
    try {
      colors[monacoKey] = withAlpha(rgbToHex(themeProvider, color), alpha)
    } catch {
      // skip unresolvable colors
    }
  }

  // Editor background & foreground
  map('editor.background', theme.background?.default)
  map('editor.foreground', theme.text?.primary)

  // Line numbers
  map('editorLineNumber.foreground', theme.text?.secondary)
  map('editorLineNumber.activeForeground', theme.text?.primary)
  map('editorLineNumber.dimmedForeground', theme.text?.disabled)

  // Cursor
  map('editorCursor.foreground', theme.palette?.primary?.main)

  // Selection & highlights
  mapWithAlpha('editor.selectionBackground', theme.palette?.primary?.main, 0.35)
  mapWithAlpha('editor.selectionHighlightBackground', theme.palette?.primary?.main, 0.15)
  mapWithAlpha('editor.inactiveSelectionBackground', theme.palette?.primary?.main, 0.2)

  // Line highlight
  map('editor.lineHighlightBackground', theme.action?.selectedBackground)
  map('editor.hoverHighlightBackground', theme.action?.hoverBackground)

  // Find match
  mapWithAlpha('editor.findMatchBackground', theme.palette?.warning?.main, 0.4)
  mapWithAlpha('editor.findMatchHighlightBackground', theme.palette?.warning?.main, 0.2)

  // Gutter
  map('editorGutter.background', theme.background?.default)

  // Whitespace
  map('editorWhitespace.foreground', theme.text?.disabled)

  // Widget backgrounds (hover, suggest, etc.)
  map('editorWidget.background', theme.background?.paper)
  map('editorWidget.foreground', theme.text?.primary)
  map('editorWidget.border', theme.divider)
  map('editorHoverWidget.background', theme.background?.paper)
  map('editorHoverWidget.foreground', theme.text?.primary)
  map('editorHoverWidget.border', theme.divider)
  map('editorSuggestWidget.background', theme.background?.paper)
  map('editorSuggestWidget.foreground', theme.text?.primary)
  map('editorSuggestWidget.border', theme.divider)
  mapWithAlpha('editorSuggestWidget.selectedBackground', theme.palette?.primary?.main, 0.2)

  // Error / Warning / Info / Hint squiggles
  map('editorError.foreground', theme.palette?.error?.main)
  map('editorWarning.foreground', theme.palette?.warning?.main)
  map('editorInfo.foreground', theme.palette?.info?.main)
  map('editorHint.foreground', theme.palette?.success?.main)

  // Overview ruler markers
  map('editorOverviewRuler.errorForeground', theme.palette?.error?.main)
  map('editorOverviewRuler.warningForeground', theme.palette?.warning?.main)
  map('editorOverviewRuler.infoForeground', theme.palette?.info?.main)

  // Links
  map('editorLink.activeForeground', theme.palette?.primary?.main)

  // Bracket matching
  mapWithAlpha('editorBracketMatch.background', theme.palette?.primary?.main, 0.2)
  map('editorBracketMatch.border', theme.palette?.primary?.main)

  // Code lens
  map('editorCodeLens.foreground', theme.text?.secondary)

  // Scrollbar
  mapWithAlpha('scrollbarSlider.background', theme.text?.secondary, 0.2)
  mapWithAlpha('scrollbarSlider.hoverBackground', theme.text?.secondary, 0.35)
  mapWithAlpha('scrollbarSlider.activeBackground', theme.text?.secondary, 0.5)

  return {
    name: SHADES_THEME_NAME,
    data: {
      base,
      inherit: true,
      rules: [],
      colors,
    },
  }
}
