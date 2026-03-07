import type { ApiEndpointSchema, OpenApiDocument, RestApi } from '@furystack/rest'

/**
 * Extends a RestApi with endpoints for both schema.json and openapi.json
 */
export type WithSchemaAndOpenApiAction<T extends RestApi> = T & {
  GET: {
    '/schema': { result: ApiEndpointSchema<T>; headers: { accept: 'application/schema+json' } }
    '/openapi.json': { result: OpenApiDocument; headers: { accept: 'application/json' } }
  }
}

/** @deprecated Use WithSchemaAndOpenApiAction instead */
export type WithSchemaAndSwaggerAction<T extends RestApi> = WithSchemaAndOpenApiAction<T>
