import { defineService } from '@furystack/inject'
import { editor, Uri } from 'monaco-editor'
import { jsonDefaults, type DiagnosticsOptions, type JSONSchema } from 'monaco-editor/languages/features/json/register'

export const MonacoModelProvider = defineService({
  name: 'monacoModelProvider',
  lifetime: 'singleton',
  factory: () => {
    return {
      getModelForEntityType({
        value = '',
        uri,
        jsonSchema,
        diagnosticOptions,
      }: {
        value?: string
        uri: string
        jsonSchema: JSONSchema
        diagnosticOptions: DiagnosticsOptions
      }) {
        const modelUri = Uri.parse(uri)

        const stringUri = modelUri.toString()

        const existingModel = editor.getModel(modelUri)
        if (existingModel) {
          existingModel.setValue(value)
          return existingModel
        }

        jsonDefaults.setDiagnosticsOptions({
          validate: true,
          enableSchemaRequest: false,
          schemaValidation: 'error',
          ...diagnosticOptions,
          schemas: [
            ...(diagnosticOptions?.schemas?.filter((schema) => schema.uri === uri) || []),
            ...(jsonDefaults.diagnosticsOptions.schemas?.filter((schema) => schema.uri === uri) || []),
            {
              uri: stringUri,
              fileMatch: [stringUri],
              schema: jsonSchema,
            },
          ],
        })

        return editor.createModel(value, 'json', modelUri)
      },
    }
  },
})
