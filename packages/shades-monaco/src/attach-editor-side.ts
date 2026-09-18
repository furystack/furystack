import { editor } from 'monaco-editor'

import { ObservableValue } from '@furystack/utils'

import { useEditorValueTracking } from './use-editor-value-tracking.js'

export type AttachEditorSideOptions = {
  codeEditor: editor.IStandaloneCodeEditor
  onValueChange?: (newValue: string) => void
  onMarkersChange?: (newMarkers: editor.IMarker[]) => void
  onStartUpdate?: () => void
  onEndUpdate?: () => void
}

export type EditorSideListeners = {
  markerObserver: ObservableValue<editor.IMarker[]>
  [Symbol.dispose]: () => void
}

/**
 * Subscribes to value, marker, and update events on one Monaco standalone editor.
 * Used for the single editor and for each pane of a diff editor.
 */
export const attachEditorSide = ({
  codeEditor,
  onValueChange,
  onMarkersChange,
  onStartUpdate,
  onEndUpdate,
}: AttachEditorSideOptions): EditorSideListeners => {
  const valueTracker = useEditorValueTracking({ editor: codeEditor })
  if (onValueChange) {
    valueTracker.valueObservable.subscribe(onValueChange)
  }

  const markerObserver = new ObservableValue<editor.IMarker[]>([], {
    compare: (lastMarkers, nextMarkers) => JSON.stringify(lastMarkers) !== JSON.stringify(nextMarkers),
  })

  const decorationsSubscription = codeEditor.onDidChangeModelDecorations(() => {
    const model = codeEditor.getModel()
    markerObserver.setValue(editor.getModelMarkers({ resource: model?.uri }))
  })

  const markerSubscription = markerObserver.subscribe((newMarkers) => {
    onMarkersChange?.(newMarkers)
  })

  const beginUpdateSubscription = codeEditor.onBeginUpdate(() => {
    onStartUpdate?.()
  })

  const endUpdateSubscription = codeEditor.onEndUpdate(() => {
    onEndUpdate?.()
  })

  return {
    markerObserver,
    [Symbol.dispose]: () => {
      decorationsSubscription.dispose()
      beginUpdateSubscription.dispose()
      endUpdateSubscription.dispose()
      markerSubscription[Symbol.dispose]()
      markerObserver[Symbol.dispose]()
      valueTracker[Symbol.dispose]()
    },
  }
}
