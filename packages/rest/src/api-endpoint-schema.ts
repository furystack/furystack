import type { Method } from './methods.js'

/**
 * The JSON schema type used for API endpoint definitions.
 */
export type Schema = unknown // TODO: Fix me

/**
 * Represents the definition of an API endpoint, including its method, path, schema, and schema name.
 */
export type ApiEndpointDefinition = {
  /**
   * The HTTP method for the endpoint (e.g., GET, POST, PUT, DELETE).
   */
  method: Method
  /**
   * The path of the endpoint, which is the URL pattern that the endpoint responds to.
   */
  path: string
  /**
   * The JSON schema that defines the structure of the request and response for this endpoint.
   * To include a schema, wrap your endpoint with a Validate({...}) call during the implementation.
   */
  schema: Schema
  /**
   * The name of the schema, which can be used to reference this schema in documentation or other contexts.
   * To include a schema name, wrap your endpoint with a Validate({...}) call during the implementation.
   */
  schemaName: string
  /**
   * Indicates whether the endpoint requires authentication.
   * To include the flag, wrap your endpoint with an Authenticat() call during the implementation.
   */
  isAuthenticated: boolean
}

/**
 * Represents the schema for an API, which is a record of endpoint definitions keyed by their paths.
 */
export type ApiEndpointSchema = Record<string, ApiEndpointDefinition>
