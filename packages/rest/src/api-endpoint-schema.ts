import type { Method } from './methods.js'

/**
 * The JSON schema type used for API endpoint definitions.
 */
export type Schema = unknown // TODO: Fix me

/**
 * Represents the definition of an API endpoint, including its method, path, schema, and schema name.
 */
export type ApiEndpointDefinition = {
  method: Method
  path: string
  schema: Schema
  schemaName: string
}

/**
 * Represents the schema for an API, which is a record of endpoint definitions keyed by their paths.
 */
export type ApiEndpointSchema = Record<string, ApiEndpointDefinition>
