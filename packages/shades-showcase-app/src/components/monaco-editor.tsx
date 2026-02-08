import { Shade } from '@furystack/shades'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/editor/editor.main.js'

import { ThemeProviderService, defaultDarkTheme } from '@furystack/shades-common-components'
import './worker-config.js'

export interface MonacoEditorProps {
  options: editor.IStandaloneEditorConstructionOptions
  value?: string
  onchange?: (value: string) => void
  style?: Partial<CSSStyleDeclaration>
}
export const MonacoEditor = Shade<MonacoEditorProps>({
  shadowDomName: 'monaco-editor',
  render: ({ element, props, useDisposable, injector }) => {
    useDisposable('editor-init', () => {
      const themeProvider = injector.getInstance(ThemeProviderService)

      const editorInstance = editor.create(element as HTMLElement, {
        theme: themeProvider.getAssignedTheme().name === defaultDarkTheme.name ? 'vs-dark' : 'vs-light',
        ...props.options,
      })
      editorInstance.setValue(props.value || '')
      if (props.onchange) {
        editorInstance.onKeyUp(() => {
          const value = editorInstance.getValue()
          props.onchange?.(value)
        })
      }

      const themeSub = themeProvider.subscribe('themeChanged', () => {
        editorInstance.updateOptions({
          theme: themeProvider.getAssignedTheme().name === defaultDarkTheme.name ? 'vs-dark' : 'vs-light',
        })
      })

      return {
        [Symbol.dispose]: () => {
          themeSub[Symbol.dispose]()
          editorInstance.dispose()
        },
      }
    })

    element.style.display = 'block'
    element.style.height = '100%'
    element.style.width = '100%'
    element.style.position = 'relative'
    if (props.style) {
      Object.assign(element.style, props.style)
    }
    return null
  },
})
