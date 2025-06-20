import type { RestApi } from '@furystack/rest'
import type { SwaggerDocument } from '../swagger/generate-swagger-json.js'

/**
 * Extends a RestApi with endpoints for both schema.json and swagger.json
 */
export type WithSchemaAndSwaggerAction<T extends RestApi> = T & {
  GET: {
    '/schema': { result: Record<string, any>; headers: { accept: 'application/schema+json' } }
    '/swagger.json': { result: SwaggerDocument; headers: { accept: 'application/swagger+json' } }
  }
}
