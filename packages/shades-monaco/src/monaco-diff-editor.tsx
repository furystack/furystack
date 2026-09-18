import { Shade, createComponent } from '@furystack/shades'
import type { editor } from 'monaco-editor/editor/editor.api'

import { syncDiffEditorModels } from './sync-diff-editor-models.js'
import { useDiffEditorInstance } from './use-diff-editor-instance.js'
import type { SchemaOptions } from './monaco-editor.js'

export type EditorOptions = {
  value?: string
  language?: string
  schema?: SchemaOptions
  onValueChange?: (value: string) => void
  onMarkersChange?: (newMarkers: editor.IMarker[]) => void
  onStartUpdate?: () => void
  onEndUpdate?: () => void
}

export type MonacoDiffEditorProps = {
  /**
   * Options for the standalone diff editor instance
   */
  options: editor.IStandaloneDiffEditorConstructionOptions
  /**
   * Original (left) pane value, schema, and change callbacks
   */
  originalOptions?: EditorOptions
  /**
   * Modified (right) pane value, schema, and change callbacks
   */
  modifiedOptions?: EditorOptions
  /**
   * Optional styling
   */
  style?: Partial<CSSStyleDeclaration>
}

/**
 * Component that encapsulates a Monaco Diff Editor instance
 */
export const MonacoDiffEditor = Shade<MonacoDiffEditorProps>({
  customElementName: 'monaco-diff-editor',
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
      const container = containerRef.current
      if (!container) {
        return
      }

      const createdDiffEditor = useDisposable('editor-instance', () =>
        useDiffEditorInstance({
          element: container,
          injector,
          options: props.options,
          original: {
            onValueChange: props.originalOptions?.onValueChange,
            onMarkersChange: props.originalOptions?.onMarkersChange,
            onStartUpdate: props.originalOptions?.onStartUpdate,
            onEndUpdate: props.originalOptions?.onEndUpdate,
          },
          modified: {
            onValueChange: props.modifiedOptions?.onValueChange,
            onMarkersChange: props.modifiedOptions?.onMarkersChange,
            onStartUpdate: props.modifiedOptions?.onStartUpdate,
            onEndUpdate: props.modifiedOptions?.onEndUpdate,
          },
        }),
      )

      syncDiffEditorModels(createdDiffEditor.diffEditorInstance, props.originalOptions, props.modifiedOptions)
    })

    return <div ref={containerRef} data-spatial-nav-passthrough="" style={{ width: '100%', height: '100%' }} />
  },
})
