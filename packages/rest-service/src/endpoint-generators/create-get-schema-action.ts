import { RequestError } from '@furystack/rest'
import type { RestApiImplementation } from '../api-manager.js'
import { getSchemaFromApi } from '../get-schema-from-api.js'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'

export type GetSchemaResult = ReturnType<typeof getSchemaFromApi>

/**
 * Creates a GET action that returns the schema of the provided API.
 * The schema is returned in JSON format when the request's Accept header includes 'application/schema+json'.
 * If the Accept header does not match, a 406 Not Acceptable error is thrown.
 *
 * @param api - The API implementation from which to extract the schema.
 * @returns A RequestAction that handles the GET request for the schema.
 */
export const CreateGetSchemaAction = <T extends RestApiImplementation<any>>(
  api: T,
  name = 'FuryStack API',
  description = 'API documentation generated from FuryStack API schema',
  version = '1.0.0',
): RequestAction<{ result: GetSchemaResult }> => {
  const schema = getSchemaFromApi({ api, name, description, version })
  return async ({ request }) => {
    if (request.headers.accept?.includes('application/schema+json')) {
      return JsonResult(schema, 200)
    }
    throw new RequestError('The requested content type is not supported. Please use "application/schema+json".', 406)
  }
}
