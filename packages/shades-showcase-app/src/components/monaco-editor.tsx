import { Shade } from '@furystack/shades'
import type { editor as editorTypes } from 'monaco-editor/esm/vs/editor/editor.api.js'
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
  css: {
    display: 'block',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  render: ({ element, props, useDisposable, injector }) => {
    if (props.style) {
      Object.assign(element.style, props.style)
    }

    useDisposable('editor-init', () => {
      let editorInstance: editorTypes.IStandaloneCodeEditor | undefined
      let themeSub: Disposable | undefined

      // Defer creation to after updateComponent finishes clearing innerHTML
      queueMicrotask(() => {
        const themeProvider = injector.getInstance(ThemeProviderService)

        editorInstance = editor.create(element as HTMLElement, {
          theme: themeProvider.getAssignedTheme().name === defaultDarkTheme.name ? 'vs-dark' : 'vs-light',
          ...props.options,
        })
        editorInstance.setValue(props.value || '')
        if (props.onchange) {
          editorInstance.onKeyUp(() => {
            const value = editorInstance!.getValue()
            props.onchange?.(value)
          })
        }

        themeSub = themeProvider.subscribe('themeChanged', () => {
          editorInstance!.updateOptions({
            theme: themeProvider.getAssignedTheme().name === defaultDarkTheme.name ? 'vs-dark' : 'vs-light',
          })
        })
      })

      return {
        [Symbol.dispose]: () => {
          themeSub?.[Symbol.dispose]()
          editorInstance?.dispose()
        },
      }
    })

    return null
  },
})
