import { ActionResult, RequestAction, RequestActionOptions } from './request-action-implementation'
import { SchemaValidator } from './schema-validator'

export const Validate = <
  TSchema extends { definitions: { [K: string]: { required?: string[] } | any } }
>(validationOptions: {
  /**
   * The Schema object
   */
  schema: TSchema
  /**
   * Entity key from the JSON Schema object
   */
  schemaName: keyof TSchema['definitions']
}) => <T extends { result: any }>(action: RequestAction<T>): RequestAction<T> => {
  const schema = { ...validationOptions.schema }

  Object.values(schema.definitions).forEach((definition) => {
    if (definition.required && definition.required.includes('result')) {
      definition.required = definition.required.filter((value: any) => value !== 'result')
    }
    if (definition.properties?.headers) {
      definition.properties.headers.additionalProperties = true
    }
  })

  const validator = new SchemaValidator(schema, { coerceTypes: true })

  return async (args: RequestActionOptions<T>): Promise<ActionResult<T>> => {
    const { query, body, url, headers } = args as any
    validator.isValid({ query, body, url, headers }, { schemaName: validationOptions.schemaName })
    return await action(args)
  }
}
