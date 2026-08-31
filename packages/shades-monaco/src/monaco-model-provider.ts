import { defineService } from '@furystack/inject'
import { Uri } from 'monaco-editor'
import { jsonDefaults, type DiagnosticsOptions, type JSONSchema } from 'monaco-editor/languages/features/json/register'

export const MonacoModelProvider = defineService({
  name: 'monacoModelProvider',
  lifetime: 'singleton',
  factory: () => {
    return {
      getModelUriForEntityType({
        uri,
        jsonSchema,
        diagnosticOptions,
      }: {
        uri: string
        jsonSchema: JSONSchema
        diagnosticOptions: DiagnosticsOptions
      }) {
        const modelUri = Uri.parse(uri)
        if (jsonDefaults.diagnosticsOptions.schemas?.some((schema) => schema.uri === uri)) {
          return modelUri
        }

        jsonDefaults.setDiagnosticsOptions({
          validate: true,
          enableSchemaRequest: false,
          schemaValidation: 'error',

          ...diagnosticOptions,
          schemas: [
            ...(diagnosticOptions?.schemas || []),
            ...(jsonDefaults.diagnosticsOptions.schemas?.filter((schema) => schema.uri === uri) || []),
            {
              uri,
              fileMatch: [modelUri.toString()],
              schema: { ...jsonSchema },
            },
          ],
        })
        return modelUri
      },
    }
  },
})
