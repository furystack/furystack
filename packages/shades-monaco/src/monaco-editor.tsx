import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import type { editor as editorTypes } from 'monaco-editor/editor'
import { editor } from 'monaco-editor/editor/editor.api'
import { useEditorInstance } from './use-editor-instance.js'

export interface MonacoEditorProps {
  options: editor.IStandaloneEditorConstructionOptions
  value?: string
  onValueChange?: (value: string) => void
  style?: Partial<CSSStyleDeclaration>
  onMarkersChange?: (newMarkers: editorTypes.IMarker[]) => void
}
export const MonacoEditor = Shade<MonacoEditorProps>({
  customElementName: 'monaco-editor',
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

    queueMicrotask(() => {
      if (!containerRef.current) {
        return
      }

      const { editorInstance } = useDisposable('editor-instance', () =>
        useEditorInstance({ element: containerRef.current!, injector, options: props.options }),
      )

      editorInstance.setValue(props.value || '')
      if (props.onValueChange) {
        editorInstance.onDidChangeModelContent(() => {
          const newValue = editorInstance.getValue()
          if (newValue !== props.value) {
            props.onValueChange?.(newValue)
          }
        })
      }

      if (props.onMarkersChange) {
        const markers = useDisposable('markers', () => {
          const obs = new ObservableValue([] as editorTypes.IMarker[], {
            compare: (a, b) => JSON.stringify(a) !== JSON.stringify(b),
          })

          if (props?.onMarkersChange) {
            obs.subscribe(props.onMarkersChange)
          }

          return obs
        })

        editorInstance.onDidChangeModelDecorations(() => {
          const model = editorInstance?.getModel()
          const currentMarkers = editor.getModelMarkers({ resource: model?.uri })
          markers.setValue(currentMarkers)
        })
      }
    })

    return <div ref={containerRef} data-spatial-nav-passthrough="" style={{ width: '100%', height: '100%' }} />
  },
})
