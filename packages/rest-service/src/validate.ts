import type { ActionResult, RequestAction, RequestActionOptions } from './request-action-implementation.js'
import { SchemaValidator } from './schema-validator/schema-validator.js'

/**
 * Represents a JSON Schema definition structure
 */
type JsonSchemaDefinition = {
  required?: string[]
  additionalProperties?: boolean
  properties?: {
    headers?: {
      additionalProperties?: boolean
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Represents a JSON Schema with definitions
 */
type JsonSchemaWithDefinitions = {
  definitions: Record<string, JsonSchemaDefinition>
}

export const Validate =
  <TSchema extends JsonSchemaWithDefinitions>(validationOptions: {
    /**
     * The Schema object
     */
    schema: TSchema
    /**
     * Entity key from the JSON Schema object
     */
    schemaName: keyof TSchema['definitions']
  }) =>
  <T extends { result: unknown }>(
    action: RequestAction<T>,
  ): RequestAction<T> & {
    schema: TSchema
    schemaName: keyof TSchema['definitions']
  } => {
    const schema = { ...validationOptions.schema }

    Object.values(schema.definitions).forEach((definition) => {
      if (definition.required?.includes('result')) {
        definition.required = definition.required.filter((value) => value !== 'result')
      }
      definition.additionalProperties = true
      if (definition.properties?.headers) {
        definition.properties.headers.additionalProperties = true
      }
    })

    const validator = new SchemaValidator(schema, { coerceTypes: true, strict: false })

    const wrapped = async (args: RequestActionOptions<T>): Promise<ActionResult<T['result']>> => {
      const headers = 'headers' in args ? (args.headers as Record<string, string>) : undefined
      const query = 'getQuery' in args ? (args as { getQuery: () => unknown }).getQuery() : undefined
      const url = 'getUrlParams' in args ? (args as { getUrlParams: () => unknown }).getUrlParams() : undefined

      let body: unknown
      try {
        if ('getBody' in args) {
          body = await (args as { getBody: () => Promise<unknown> }).getBody()
        }
      } catch {
        // Body parsing may fail for requests without body
      }

      validator.isValid(
        {
          ...(query !== undefined ? { query } : {}),
          ...(body !== undefined ? { body } : {}),
          ...(url !== undefined ? { url } : {}),
          ...(headers !== undefined ? { headers } : {}),
        },
        { schemaName: validationOptions.schemaName },
      )

      const validatedArgs = {
        request: args.request,
        response: args.response,
        injector: args.injector,
        ...(headers !== undefined && { headers }),
        ...(query !== undefined && { getQuery: () => query }),
        ...(url !== undefined && { getUrlParams: () => url }),
        ...(body !== undefined && { getBody: () => Promise.resolve(body) }),
      } as RequestActionOptions<T>

      return await action(validatedArgs)
    }

    return Object.assign(wrapped, {
      schema,
      schemaName: validationOptions.schemaName,
    })
  }
