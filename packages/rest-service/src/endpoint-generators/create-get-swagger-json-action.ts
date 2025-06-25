import { type ApiEndpointDefinition, type SwaggerDocument } from '@furystack/rest'
import type { RestApiImplementation } from '../api-manager.js'
import { getSchemaFromApi } from '../get-schema-from-api.js'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'
import { generateSwaggerJsonFromApiSchema } from '../swagger/generate-swagger-json.js'

export type GetSchemaResult = Record<string, ApiEndpointDefinition>

/**
 * Generates a RequestAction that retrieves the Swagger JSON schema from a FuryStack API implementation.
 *
 * @param api - The API implementation from which to extract the schema.
 * @returns A RequestAction that handles the GET request for the schema.
 */
export const CreateGetSwaggerJsonAction = <T extends RestApiImplementation<any>>(
  api: T,
  name = 'FuryStack API',
  description = 'API documentation generated from FuryStack API schema',
  version = '1.0.0',
): RequestAction<{ result: GetSchemaResult | SwaggerDocument }> => {
  const { endpoints } = getSchemaFromApi({ api, name, description, version })
  const swaggerJson = generateSwaggerJsonFromApiSchema({ api: endpoints, title: name, description, version })
  return async () => {
    return JsonResult(swaggerJson, 200)
  }
}
