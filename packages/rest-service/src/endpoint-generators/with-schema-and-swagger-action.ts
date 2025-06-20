import type { RestApi, SwaggerDocument } from '@furystack/rest'

/**
 * Extends a RestApi with endpoints for both schema.json and swagger.json
 */
export type WithSchemaAndSwaggerAction<T extends RestApi> = T & {
  GET: {
    '/schema': { result: Record<string, any>; headers: { accept: 'application/schema+json' } }
    '/swagger.json': { result: SwaggerDocument; headers: { accept: 'application/swagger+json' } }
  }
}
