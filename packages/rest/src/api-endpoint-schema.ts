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
 * The JSON Schema type used for API endpoint definitions.
 *
 * This is intentionally `unknown` because the exact schema shape depends on
 * the generator used (e.g. `ts-json-schema-generator` produces Draft 7-style
 * objects with `definitions`, while consumed OpenAPI documents use 3.1-style
 * objects). Narrowing to `object | boolean` would break runtime usages where
 * the schema is `null` or omitted.
 */
export type Schema = unknown

/**
 * Reflection metadata for a single endpoint. Populated by the wrappers
 * applied at definition time (`Validate()`, `Authenticate()`) and read by
 * `generateOpenApiDocument` and the `/schema` action. The HTTP method is
 * implicit in the parent {@link ApiEndpointSchema} structure key.
 */
export type ApiEndpointDefinition = {
  path: string
  /** Populated by `Validate({ schema })`. Empty string when missing. */
  schema: Schema
  /** Populated by `Validate({ schemaName })`. Empty string when missing. */
  schemaName: string
  /** Populated by `Authenticate()` wrapping the action. */
  isAuthenticated: boolean
  tags?: string[]
  deprecated?: boolean
  summary?: string
  description?: string
  /**
   * OpenAPI security scheme names required for this endpoint. Populated by
   * `Authorize()` and friends. When present overrides the
   * `isAuthenticated` boolean fallback in `generateOpenApiDocument`.
   */
  securitySchemes?: string[]
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
