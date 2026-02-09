import { Shade, createComponent } from '@furystack/shades'
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
  render: ({ props, useDisposable, injector, useHostProps, useRef }) => {
    const containerRef = useRef<HTMLDivElement>('editorContainer')

    if (props.style) {
      useHostProps({ style: props.style as Record<string, string> })
    }

    useDisposable('editor-init', () => {
      let editorInstance: editorTypes.IStandaloneCodeEditor | undefined
      let themeSub: Disposable | undefined

      queueMicrotask(() => {
        if (!containerRef.current) return
        const themeProvider = injector.getInstance(ThemeProviderService)

        editorInstance = editor.create(containerRef.current, {
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

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  },
})
