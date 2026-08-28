import { Shade, createComponent } from '@furystack/shades'
import type { editor } from 'monaco-editor/editor/editor.api'
import type { JSONSchema } from 'monaco-editor/languages/features/json/register.js'
import { useEditorInstance } from './use-editor-instance.js'
import { useEditorSchema } from './use-editor-schema.js'

export interface MonacoEditorProps {
  options: editor.IStandaloneEditorConstructionOptions
  value?: string
  onValueChange?: (value: string) => void
  style?: Partial<CSSStyleDeclaration>
  onMarkersChange?: (newMarkers: editor.IMarker[]) => void
  schema?: { uri: string; jsonSchema: JSONSchema }
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

      const editor = useDisposable('editor-instance', () =>
        useEditorInstance({
          element: containerRef.current!,
          injector,
          options: props.options,
          value: props.value,
          onValueChange: props.onValueChange,
          onMarkersChange: props.onMarkersChange,
        }),
      )

      // Allow controlled mode changes
      if (props.value && editor.editorInstance.getValue() !== props.value) {
        editor.editorInstance.setValue(props.value)
      }

      if (props.schema && editor.editorInstance) {
        useEditorSchema({ injector, editorInstance: editor.editorInstance, schema: props.schema })
      }
    })

    return <div ref={containerRef} data-spatial-nav-passthrough="" style={{ width: '100%', height: '100%' }} />
  },
})
