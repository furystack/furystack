
import { editor, Uri } from 'monaco-editor';
import { jsonDefaults, type DiagnosticsOptions, type JSONSchema } from 'monaco-editor/languages/features/json/register';

export type ProvideMonacoModelOptions = {
  /**
   * The text value of the model
   */
  value?: string
  /**
   * The URI of the model schema. Should be unique. If you use fetch, it should have http(s):// protocol
   */
  uri: string
  /**
   * The JSON Schema of the model.
   */
  jsonSchema: JSONSchema
  /**
   * Additional diagnostic options, like validation, warn levels, fetch or trailing commas
   */
  diagnosticOptions: DiagnosticsOptions
}

/**
 * Provides a Monaco model for a given JSON Schema
 * 
 * @param options - The options for the model
 * @returns The Monaco model
 */
export const provideMonacoModel = ({
        value = '',
        uri,
  jsonSchema,
  diagnosticOptions,
}: ProvideMonacoModelOptions) => {
        const modelUri = Uri.parse(uri)

        const stringUri = modelUri.toString()

        const existingModel = editor.getModel(modelUri)
        if (existingModel) {
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
    };
