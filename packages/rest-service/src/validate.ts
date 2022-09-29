import type { ActionResult, RequestAction, RequestActionOptions } from './request-action-implementation'
import { SchemaValidator } from './schema-validator'

export const Validate =
  <TSchema extends { definitions: { [K: string]: { required?: string[] } | any } }>(validationOptions: {
    /**
     * The Schema object
     */
    schema: TSchema
    /**
     * Entity key from the JSON Schema object
     */
    schemaName: keyof TSchema['definitions']
  }) =>
  <T extends { result: any }>(action: RequestAction<T>): RequestAction<T> => {
    const schema = { ...validationOptions.schema }

    Object.values(schema.definitions).forEach((definition) => {
      if (definition.required && definition.required.includes('result')) {
        definition.required = definition.required.filter((value: any) => value !== 'result')
      }
      definition.additionalProperties = true
      if (definition.properties?.headers) {
        definition.properties.headers.additionalProperties = true
      }
    })

    const validator = new SchemaValidator(schema, { coerceTypes: true, strict: false })

    return async (args: RequestActionOptions<T>): Promise<ActionResult<T>> => {
      const anyArgs = args as any
      let body!: any
      const { headers } = anyArgs
      const query = anyArgs.getQuery?.()
      const url = anyArgs.getUrlParams?.()
      try {
        body = await anyArgs.getBody?.()
      } catch (error) {
        // ignore
      }
      validator.isValid(
        {
          ...(query ? { query } : {}),
          ...(body ? { body } : {}),
          ...(url ? { url } : {}),
          ...(headers ? { headers } : {}),
        },
        { schemaName: validationOptions.schemaName },
      )
      return await action({
        request: args.request,
        response: args.response,
        injector: args.injector,
        headers,
        getQuery: () => query,
        getUrlParams: () => url,
        getBody: () => Promise.resolve(body),
      } as any)
    }
  }
