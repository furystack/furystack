import type { ApiEndpointSchema } from './api-endpoint-schema.js'
import type { Method } from './methods.js'
import type { SwaggerDocument } from './swagger-document.js'

export type RestApi = {
  [TMethod in Method]?: {
    [TUrl: string]: { result: unknown; url?: unknown; query?: unknown; body?: unknown; headers?: unknown }
  }
}

/**
 * Represents an API with a GET action to retrieve its schema.
 * This type extends the base RestApi type to include a specific GET endpoint for schema retrieval.
 */
export type WithSchemaAction<T extends RestApi> = T & {
  GET: {
    '/schema': { result: ApiEndpointSchema<T>; headers: { accept: 'application/schema+json' } }
    '/swagger.json': { result: SwaggerDocument }
  }
}
