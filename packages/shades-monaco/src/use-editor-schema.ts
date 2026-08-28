import { type editor as EditorType } from 'monaco-editor'
import { editor } from 'monaco-editor/editor/editor.api'
import type { JSONSchema } from 'monaco-editor/languages/features/json/register.js'
import type { Injector } from '../../inject/src/injector.js'
import { MonacoModelProvider } from './monaco-model-provider.js'

export const useEditorSchema = ({
  injector,
  editorInstance,
  schema,
}: {
  injector: Injector

  editorInstance: EditorType.IStandaloneCodeEditor
  /**
   * An optional JSON Schema to use for validation
   */
  schema: {
    /**
     * An unique schema name used to generate unique Schema URIs
     */
    uri: string
    /**
     * The JSON Schema Definition
     */
    jsonSchema: JSONSchema
  }
}) => {
  const oldModel = editorInstance.getModel()!

  const monacoModelProvider = injector.get(MonacoModelProvider)
  const uri = monacoModelProvider.getModelUriForEntityType(schema)

  if (oldModel.uri !== uri) {
    const newModel = editor.createModel(oldModel.getValue(), 'json', uri)
    editorInstance.setModel(newModel)
    oldModel.dispose()
  }
}
