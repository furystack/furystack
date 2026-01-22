import type { Method } from './methods.js'

/**
 * The JSON schema type used for API endpoint definitions.
 */
export type Schema = unknown // TODO: Fix me

/**
 * Represents the definition of an API endpoint, including its path, schema, and schema name.
 * The HTTP method is now implicit in the structure key.
 */
export type ApiEndpointDefinition = {
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
 * Represents the schema for an API, organized by HTTP method and then by path.
 * This structure allows multiple endpoints with the same path but different methods.
 */
export type ApiEndpointSchema = {
  name: string
  description: string
  version: string
  endpoints: {
    [TMethod in Method]?: Record<string, ApiEndpointDefinition>
  }
}
