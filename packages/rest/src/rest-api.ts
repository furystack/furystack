import type { ApiEndpointSchema } from './api-endpoint-schema.js'
import type { Method } from './methods.js'
import type { OpenApiDocument } from './openapi-document.js'

/**
 * Defines the shape of a REST API as a mapping of HTTP methods to path-endpoint pairs.
 * Each endpoint describes its result type and optionally its URL parameters, query parameters,
 * request body, headers, and metadata like tags/deprecated/summary/description.
 *
 * This type is the shared contract between `@furystack/rest-service` (server) and
 * `@furystack/rest-client-fetch` (client). It can also be derived from an OpenAPI document
 * using `OpenApiToRestApi<T>`.
 */
export type RestApi = {
  [TMethod in Method]?: {
    [TUrl: string]: {
      result: unknown
      url?: unknown
      query?: unknown
      body?: unknown
      headers?: unknown
      tags?: string[]
      deprecated?: boolean
      summary?: string
      description?: string
    }
  }
}

/**
 * Represents an API with a GET action to retrieve its schema and OpenAPI document.
 * This type extends the base RestApi type to include specific GET endpoints for schema and OpenAPI retrieval.
 */
export type WithSchemaAction<T extends RestApi> = T & {
  GET: {
    '/schema': { result: ApiEndpointSchema<T>; headers: { accept: 'application/schema+json' } }
    '/openapi.json': { result: OpenApiDocument }
    /** @deprecated Use `/openapi.json` instead. This endpoint will be removed in a future major version. */
    '/swagger.json': { result: OpenApiDocument }
  }
}
