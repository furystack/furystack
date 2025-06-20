import { type ApiEndpointDefinition } from '@furystack/rest'
import type { RestApiImplementation } from '../api-manager.js'
import { getSchemaFromApi } from '../get-schema-from-api.js'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'
import { generateSwaggerJsonFromApiSchema, type SwaggerDocument } from '../swagger/generate-swagger-json.js'

export type GetSchemaResult = Record<string, ApiEndpointDefinition>

/**
 * Generates a RequestAction that retrieves the Swagger JSON schema from a FuryStack API implementation.
 *
 * @param api - The API implementation from which to extract the schema.
 * @returns A RequestAction that handles the GET request for the schema.
 */
export const CreateGetSwaggerJsonAction = <T extends RestApiImplementation<any>>(
  api: T,
): RequestAction<{ result: GetSchemaResult | SwaggerDocument }> => {
  const schema = getSchemaFromApi(api)
  const swaggerJson = generateSwaggerJsonFromApiSchema(schema)
  return async () => {
    return JsonResult(swaggerJson, 200)
  }
}
