import { editor } from 'monaco-editor'

import { provideMonacoModel } from './provide-monaco-model.js'
import type { SchemaOptions } from './monaco-editor.js'

export type DiffEditorSideModelOptions = {
  value?: string
  language?: string
  schema?: SchemaOptions
}

const resolveSideModel = (
  side: DiffEditorSideModelOptions | undefined,
  current: editor.ITextModel | null,
): editor.ITextModel => {
  if (side?.schema) {
    return provideMonacoModel({
      ...side.schema,
      value: side.value,
    })
  }
  if (current) {
    return current
  }
  return editor.createModel(side?.value ?? '', side?.language)
}

const syncSideValue = (codeEditor: editor.IStandaloneCodeEditor, value?: string): void => {
  if (value !== undefined && codeEditor.getValue() !== value) {
    codeEditor.setValue(value)
  }
}

/**
 * Ensures the diff editor has original/modified models and applies controlled
 * value updates. Replaces models when a JSON schema URI changes.
 */
export const syncDiffEditorModels = (
  diffEditor: editor.IStandaloneDiffEditor,
  originalOptions?: DiffEditorSideModelOptions,
  modifiedOptions?: DiffEditorSideModelOptions,
): void => {
  const current = diffEditor.getModel()
  const nextOriginal = resolveSideModel(originalOptions, current?.original ?? null)
  const nextModified = resolveSideModel(modifiedOptions, current?.modified ?? null)

  if (!current || current.original !== nextOriginal || current.modified !== nextModified) {
    diffEditor.setModel({ original: nextOriginal, modified: nextModified })
    if (current?.original && current.original !== nextOriginal) {
      current.original.dispose()
    }
    if (current?.modified && current.modified !== nextModified) {
      current.modified.dispose()
    }
  }

  syncSideValue(diffEditor.getOriginalEditor(), originalOptions?.value)
  syncSideValue(diffEditor.getModifiedEditor(), modifiedOptions?.value)
}
