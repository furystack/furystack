import { using } from '@furystack/utils'
import { editor } from 'monaco-editor'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { attachEditorSide } from './attach-editor-side.js'

vi.mock('monaco-editor', () => ({
  editor: {
    getModelMarkers: vi.fn(() => []),
  },
}))

const createFakeCodeEditor = (initialValue = 'hello') => {
  let value = initialValue
  const contentListeners: Array<() => void> = []
  const endListeners: Array<() => void> = []
  const beginListeners: Array<() => void> = []
  const decorationListeners: Array<() => void> = []

  return {
    getValue: (): string => value,
    setValue: (next: string): void => {
      value = next
    },
    getModel: (): editor.ITextModel =>
      ({
        uri: { toString: () => 'inmemory://model/test' },
      }) as editor.ITextModel,
    onDidChangeModelContent: (listener: () => void): { dispose: () => void } => {
      contentListeners.push(listener)
      return { dispose: () => undefined }
    },
    onEndUpdate: (listener: () => void): { dispose: () => void } => {
      endListeners.push(listener)
      return { dispose: () => undefined }
    },
    onBeginUpdate: (listener: () => void): { dispose: () => void } => {
      beginListeners.push(listener)
      return { dispose: () => undefined }
    },
    onDidChangeModelDecorations: (listener: () => void): { dispose: () => void } => {
      decorationListeners.push(listener)
      return { dispose: () => undefined }
    },
    emitContentChange: (): void => {
      contentListeners.forEach((listener) => listener())
    },
    emitBeginUpdate: (): void => {
      beginListeners.forEach((listener) => listener())
    },
    emitEndUpdate: (): void => {
      endListeners.forEach((listener) => listener())
    },
    emitDecorationsChange: (): void => {
      decorationListeners.forEach((listener) => listener())
    },
  }
}

describe('attachEditorSide', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should notify onValueChange when the editor content changes', () => {
    const codeEditor = createFakeCodeEditor('first')
    const onValueChange = vi.fn()

    using(
      attachEditorSide({
        codeEditor: codeEditor as unknown as editor.IStandaloneCodeEditor,
        onValueChange,
      }),
      () => {
        codeEditor.setValue('hello world')
        codeEditor.emitContentChange()
        expect(onValueChange).toHaveBeenCalledWith('hello world')
      },
    )
  })

  it('should notify onStartUpdate and onEndUpdate', () => {
    const codeEditor = createFakeCodeEditor()
    const onStartUpdate = vi.fn()
    const onEndUpdate = vi.fn()

    using(
      attachEditorSide({
        codeEditor: codeEditor as unknown as editor.IStandaloneCodeEditor,
        onStartUpdate,
        onEndUpdate,
      }),
      () => {
        codeEditor.emitBeginUpdate()
        codeEditor.emitEndUpdate()
        expect(onStartUpdate).toHaveBeenCalledOnce()
        expect(onEndUpdate).toHaveBeenCalledOnce()
      },
    )
  })

  it('should notify onMarkersChange when decorations change', () => {
    const markers = [{ message: 'err' }] as editor.IMarker[]
    vi.spyOn(editor, 'getModelMarkers').mockReturnValue(markers)

    const codeEditor = createFakeCodeEditor()
    const onMarkersChange = vi.fn()

    using(
      attachEditorSide({
        codeEditor: codeEditor as unknown as editor.IStandaloneCodeEditor,
        onMarkersChange,
      }),
      () => {
        codeEditor.emitDecorationsChange()
        expect(onMarkersChange).toHaveBeenCalledWith(markers)
      },
    )
  })
})
