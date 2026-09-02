import { ThemeProviderService } from '@furystack/shades-common-components'
import { editor } from 'monaco-editor'
import type { Injector } from '../../inject/src/injector.js'
import { createMonacoTheme } from './create-monaco-theme.js'

/**
 * Utility method that registers a theme for Monaco Editor.
 *
 * @param injector The Injector instance that can be used to retrieve the theme provider
 * @returns The registered theme name
 */
export const provideShadesTheme = ({ injector }: { injector: Injector }) => {
  const themeProvider = injector.get(ThemeProviderService)

  const monacoTheme = createMonacoTheme(themeProvider.getAssignedTheme())
  editor.defineTheme(monacoTheme.name, monacoTheme.data)
  return monacoTheme.name
}
