import type { ApiEndpointSchema } from './api-endpoint-schema.js'
import type { Method } from './methods.js'
import type { OpenApiDocument } from './openapi-document.js'

export type RestApi = {
  [TMethod in Method]?: {
    [TUrl: string]: { result: unknown; url?: unknown; query?: unknown; body?: unknown; headers?: unknown }
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
  }
}
