import { editor } from 'monaco-editor'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { provideMonacoModel } from './provide-monaco-model.js'
import { syncDiffEditorModels } from './sync-diff-editor-models.js'

vi.mock('monaco-editor', () => ({
  editor: {
    createModel: vi.fn(),
  },
}))

vi.mock('./provide-monaco-model.js', () => ({
  provideMonacoModel: vi.fn(),
}))

const createFakeModel = (id: string): editor.ITextModel =>
  ({
    id,
    dispose: vi.fn(),
  }) as unknown as editor.ITextModel

const createFakeDiffEditor = () => {
  let originalValue = ''
  let modifiedValue = ''
  let model: editor.IDiffEditorModel | null = null

  const originalEditor = {
    getValue: (): string => originalValue,
    setValue: (value: string): void => {
      originalValue = value
    },
    getModel: (): editor.ITextModel | null => model?.original ?? null,
  }

  const modifiedEditor = {
    getValue: (): string => modifiedValue,
    setValue: (value: string): void => {
      modifiedValue = value
    },
    getModel: (): editor.ITextModel | null => model?.modified ?? null,
  }

  return {
    originalEditor,
    modifiedEditor,
    getModel: (): editor.IDiffEditorModel | null => model,
    setModel: (next: editor.IDiffEditorModel | null): void => {
      model = next
    },
    getOriginalEditor: () => originalEditor,
    getModifiedEditor: () => modifiedEditor,
  }
}

describe('syncDiffEditorModels', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create models when the diff editor has none', () => {
    const originalModel = createFakeModel('original')
    const modifiedModel = createFakeModel('modified')
    const createModel = vi
      .spyOn(editor, 'createModel')
      .mockReturnValueOnce(originalModel)
      .mockReturnValueOnce(modifiedModel)

    const diffEditor = createFakeDiffEditor()

    syncDiffEditorModels(diffEditor as unknown as editor.IStandaloneDiffEditor, { value: 'old' }, { value: 'new' })

    expect(createModel).toHaveBeenCalledWith('old', undefined)
    expect(createModel).toHaveBeenCalledWith('new', undefined)
    expect(diffEditor.getModel()).toEqual({ original: originalModel, modified: modifiedModel })
    expect(diffEditor.originalEditor.getValue()).toBe('old')
    expect(diffEditor.modifiedEditor.getValue()).toBe('new')
  })

  it('should update values on existing models without recreating them', () => {
    const originalModel = createFakeModel('original')
    const modifiedModel = createFakeModel('modified')
    const diffEditor = createFakeDiffEditor()
    diffEditor.setModel({ original: originalModel, modified: modifiedModel })
    diffEditor.originalEditor.setValue('old')
    diffEditor.modifiedEditor.setValue('new')

    const createModel = vi.spyOn(editor, 'createModel')

    createModel.mockClear()

    syncDiffEditorModels(
      diffEditor as unknown as editor.IStandaloneDiffEditor,
      { value: 'old-updated' },
      { value: 'new-updated' },
    )

    expect(createModel).not.toHaveBeenCalled()
    expect(diffEditor.getModel()).toEqual({ original: originalModel, modified: modifiedModel })
    expect(diffEditor.originalEditor.getValue()).toBe('old-updated')
    expect(diffEditor.modifiedEditor.getValue()).toBe('new-updated')
  })

  it('should replace models when schema URIs resolve to different instances', () => {
    const currentOriginal = createFakeModel('current-original')
    const currentModified = createFakeModel('current-modified')
    const nextOriginal = createFakeModel('next-original')
    const nextModified = createFakeModel('next-modified')

    const diffEditor = createFakeDiffEditor()
    diffEditor.setModel({ original: currentOriginal, modified: currentModified })

    vi.mocked(provideMonacoModel).mockReturnValueOnce(nextOriginal).mockReturnValueOnce(nextModified)

    const schema = {
      uri: 'inmemory://schema.json',
      jsonSchema: {},
      diagnosticOptions: {},
    }

    syncDiffEditorModels(
      diffEditor as unknown as editor.IStandaloneDiffEditor,
      { schema, value: '{}' },
      { schema, value: '{ }' },
    )

    expect(diffEditor.getModel()).toEqual({ original: nextOriginal, modified: nextModified })
    expect(currentOriginal.dispose).toHaveBeenCalledOnce()
    expect(currentModified.dispose).toHaveBeenCalledOnce()
  })
})
