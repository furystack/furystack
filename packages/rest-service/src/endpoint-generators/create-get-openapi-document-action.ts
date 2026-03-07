import type { OpenApiDocument } from '@furystack/rest'
import type { RestApiImplementation } from '../api-manager.js'
import { getSchemaFromApi } from '../get-schema-from-api.js'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'
import { generateOpenApiDocument } from '../openapi/generate-openapi-document.js'

/**
 * Generates a RequestAction that retrieves the OpenAPI document from a FuryStack API implementation.
 *
 * @param api - The API implementation from which to extract the schema.
 * @returns A RequestAction that handles the GET request for the OpenAPI document.
 */
export const CreateGetOpenApiDocumentAction = <T extends RestApiImplementation<any>>(
  api: T,
  name = 'FuryStack API',
  description = 'API documentation generated from FuryStack API schema',
  version = '1.0.0',
): RequestAction<{ result: OpenApiDocument }> => {
  const { endpoints } = getSchemaFromApi({ api, name, description, version })
  const openApiDoc = generateOpenApiDocument({ api: endpoints, title: name, description, version })
  return async () => {
    return JsonResult(openApiDoc, 200)
  }
}

/** @deprecated Use CreateGetOpenApiDocumentAction instead */
export const CreateGetSwaggerJsonAction = CreateGetOpenApiDocumentAction
