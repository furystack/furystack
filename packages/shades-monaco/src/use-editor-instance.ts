import { ThemeProviderService } from '@furystack/shades-common-components'
import { editor } from 'monaco-editor'
import type { Injector } from '../../inject/src/injector.js'
import { registerShadesTheme } from './register-shades-theme.js'

export type UseEditorInstanceOptions = {
  /**
   * The HTML Element that should be used as the base DOM element for monaco `editor.create(...)`
   */
  element: HTMLElement
  /**
   * The injector instance to retrieve neccessary services, e.g.: ThemeProviderService
   */
  injector: Injector
  /**
   * Additional options that can be passed to the Monaco Editor's `editor.create(...)` method
   */
  options: editor.IStandaloneEditorConstructionOptions
}

/**
 * Utility method to manage Monaco Editor Instance
 *
 * @param param0 The Options to use for the editor instance
 * @returns The created Editor Instance
 */
export const useEditorInstance = ({ element, injector, options }: UseEditorInstanceOptions) => {
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
