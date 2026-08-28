import { ThemeProviderService } from '@furystack/shades-common-components'
import { editor } from 'monaco-editor'
import type { Injector } from '../../inject/src/injector.js'
import { registerShadesTheme } from './register-shades-theme.js'

export const useEditorInstance = ({
  element,
  injector,
  options,
}: {
  element: HTMLElement
  injector: Injector
  options: editor.IStandaloneEditorConstructionOptions
}) => {
  const themeName = registerShadesTheme({ injector })

  const editorInstance = editor.create(element, {
    theme: themeName,
    ...options,
  })

  const themeProvider = injector.get(ThemeProviderService)
  const themeSub = themeProvider.subscribe('themeChanged', () => {
    const updatedName = registerShadesTheme({ injector })
    editor.setTheme(updatedName)
  })

  return {
    editorInstance,
    [Symbol.dispose]: () => {
      themeSub[Symbol.dispose]()
      editorInstance.dispose()
    },
  }
}
