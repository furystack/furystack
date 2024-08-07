import { Shade } from '@furystack/shades'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/editor/editor.main.js'

import { ThemeProviderService, defaultDarkTheme } from '@furystack/shades-common-components'
import './worker-config.js'

export interface MonacoEditorProps {
  options: editor.IStandaloneEditorConstructionOptions
  value?: string
  onchange?: (value: string) => void
}
export const MonacoEditor = Shade<MonacoEditorProps>({
  shadowDomName: 'monaco-editor',
  constructed: ({ element, props, useDisposable, injector }) => {
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

    useDisposable('themeChange', () =>
      themeProvider.subscribe('themeChanged', () => {
        editorInstance.updateOptions({
          theme: themeProvider.getAssignedTheme().name === defaultDarkTheme.name ? 'vs-dark' : 'vs-light',
        })
      }),
    )

    return () => editorInstance.dispose()
  },
  render: ({ element }) => {
    element.style.display = 'block'
    element.style.height = 'calc(100% - 96px)'
    element.style.width = '100%'
    element.style.position = 'relative'
    return null
  },
})
