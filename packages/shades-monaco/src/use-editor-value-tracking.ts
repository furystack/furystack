import { ObservableValue } from '@furystack/utils'
import type { editor } from 'monaco-editor'

export const useEditorValueTracking = ({ editor }: { editor: editor.IStandaloneCodeEditor }) => {
  const valueObservable = new ObservableValue(editor.getValue(), {
    compare: (a, b) => a.length !== b.length && a !== b,
  })

  const changeFn = () => valueObservable.setValue(editor.getValue())

  const contentChangeSubscription = editor.onDidChangeModelContent(changeFn)
  const endUpdateSubscription = editor.onEndUpdate(changeFn) // Needed for e.g.: CTRL+Z operations or other transactional edits

  return {
    valueObservable,
    [Symbol.dispose]: () => {
      valueObservable[Symbol.dispose]()
      contentChangeSubscription.dispose()
      endUpdateSubscription.dispose()
    },
  }
}
