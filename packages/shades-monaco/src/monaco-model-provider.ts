import { defineService } from '@furystack/inject'
import { Uri } from 'monaco-editor'
import { jsonDefaults, type JSONSchema } from 'monaco-editor/languages/features/json/register'

export const MonacoModelProvider = defineService({
  name: 'monacoModelProvider',
  lifetime: 'singleton',
  factory: () => {
    const nameUriCache = new Map<string, Uri>()

    return {
      getModelUriForEntityType({ uri, jsonSchema }: { uri: string; jsonSchema: JSONSchema }) {
        if (nameUriCache.has(uri)) {
          return nameUriCache.get(uri) as Uri
        }
        const modelUri = Uri.parse(uri)
        jsonDefaults.setDiagnosticsOptions({
          validate: true,
          enableSchemaRequest: true,
          schemaRequest: 'warning',
          schemaValidation: 'error',
          schemas: [
            ...(jsonDefaults.diagnosticsOptions.schemas || []),
            {
              uri,
              fileMatch: [modelUri.toString()],
              schema: { ...jsonSchema },
            },
          ],
        })
        nameUriCache.set(uri, modelUri)
        return modelUri
      },
    }
  },
})
