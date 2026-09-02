import { Shade, createComponent } from '@furystack/shades'
import type { editor } from 'monaco-editor/editor/editor.api'
import type { DiagnosticsOptions, JSONSchema } from 'monaco-editor/languages/features/json/register.js'
import { provideMonacoModel } from './provide-monaco-model.js'
import { useEditorInstance } from './use-editor-instance.js'

export type SchemaOptions = {
  /**
   * URI for the schema. Should be unique. If you use fetch, it should have http(s):// protocol
   */
  uri: string
  /**
   * The Schema object
   */
  jsonSchema: JSONSchema
  /**
   * Additional diagnostic options, like validation, warn levels, fetch or trailing commas
   */
  diagnosticOptions: DiagnosticsOptions
}

export type MonacoEditorProps = {
  /**
   * Options for the standalone editor instance
   */
  options: editor.IStandaloneEditorConstructionOptions
  /**
   * An optional value, in string format
   */
  value?: string
  /**
   * Callback that will be called when the value has been changed
   * @param value The new value
   */
  onValueChange?: (value: string) => void
  /**
   * Optional styling
   */
  style?: Partial<CSSStyleDeclaration>
  /**
   * Callback that will be called once the markers has been changed (errors, warnings, etc...)
   * @param newMarkers The new markers
   */
  onMarkersChange?: (newMarkers: editor.IMarker[]) => void

  onStartUpdate?: () => void

  onEndUpdate?: () => void

  /**
   * Additional options to validate JSON Schemas. Only works with JSON types.
   */
  schema?: SchemaOptions
}

/**
 * Component that encapsulates a Monaco Editor instance
 */
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

      const createdEditor = useDisposable('editor-instance', () =>
        useEditorInstance({
          element: containerRef.current!,
          injector,
          options: {
            ...(props.schema
              ? {
                  model: provideMonacoModel({
                    ...props.schema,
                    value: props.value,
                  }),
                }
              : {}),
            ...props.options,
          },
          value: props.value,
          onValueChange: props.onValueChange,
          onMarkersChange: props.onMarkersChange,
          onStartUpdate: props.onStartUpdate,
          onEndUpdate: props.onEndUpdate,
        }),
      )

      // Allow controlled mode changes
      if (props.value && createdEditor.editorInstance.getValue() !== props.value) {
        createdEditor.editorInstance.setValue(props.value)
      }

      if (props.schema) {
        const model = provideMonacoModel({
          ...props.schema,
          value: props.value,
        })
        const oldModel = createdEditor.editorInstance.getModel()
        if (oldModel !== model) {
          oldModel?.dispose()
          createdEditor.editorInstance.setModel(model)
        }
      }
    })

    return <div ref={containerRef} data-spatial-nav-passthrough="" style={{ width: '100%', height: '100%' }} />
  },
})
