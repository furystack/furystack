import type { Method } from './methods.js'
import type {
  ContactObject,
  ExternalDocumentationObject,
  LicenseObject,
  SecuritySchemeObject,
  ServerObject,
  TagObject,
} from './openapi-document.js'
import type { RestApi } from './rest-api.js'

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
   * To include the flag, wrap your endpoint with an Authenticate() call during the implementation.
   */
  isAuthenticated: boolean
  /**
   * Tags for API documentation grouping.
   */
  tags?: string[]
  /**
   * Marks the endpoint as deprecated.
   */
  deprecated?: boolean
  /**
   * A short summary of the endpoint.
   */
  summary?: string
  /**
   * A longer description of the endpoint.
   */
  description?: string
}

/**
 * Document-level metadata preserved from/to OpenAPI documents.
 * Carries info fields (contact, license, servers, tags, etc.) through the
 * `openApiToSchema()` -> `generateOpenApiDocument()` round-trip.
 */
export type ApiDocumentMetadata = {
  summary?: string
  termsOfService?: string
  contact?: ContactObject
  license?: LicenseObject
  servers?: ServerObject[]
  tags?: TagObject[]
  externalDocs?: ExternalDocumentationObject
  securitySchemes?: Record<string, SecuritySchemeObject>
}

/**
 * Represents the schema for an API, organized by HTTP method and then by path.
 * This structure allows multiple endpoints with the same path but different methods.
 * @typeParam TApi - The REST API type this schema represents. When provided, the endpoint
 *                   paths are preserved for better type safety and autocomplete.
 * @example
 * ```typescript
 * type MyApi = {
 *   GET: { '/users': { result: User[] }, '/users/:id': { result: User } }
 *   POST: { '/users': { result: User, body: CreateUser } }
 * }
 * // ApiEndpointSchema<MyApi> will have:
 * // endpoints: {
 * //   GET?: { '/users': ApiEndpointDefinition, '/users/:id': ApiEndpointDefinition }
 * //   POST?: { '/users': ApiEndpointDefinition }
 * // }
 * ```
 */
export type ApiEndpointSchema<TApi extends RestApi = RestApi> = {
  name: string
  description: string
  version: string
  metadata?: ApiDocumentMetadata
  endpoints: {
    [TMethod in Method]?: TMethod extends keyof TApi
      ? TApi[TMethod] extends Record<string, unknown>
        ? { [TPath in keyof TApi[TMethod] & string]: ApiEndpointDefinition }
        : Record<string, ApiEndpointDefinition>
      : Record<string, ApiEndpointDefinition>
  }
}
