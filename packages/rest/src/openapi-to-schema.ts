import type { ApiEndpointSchema } from './api-endpoint-schema.js'
import type { Method } from './methods.js'
import type { OpenApiDocument, Operation, ReferenceObject } from './openapi-document.js'

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'] as const

const isReferenceObject = (obj: unknown): obj is ReferenceObject =>
  typeof obj === 'object' && obj !== null && '$ref' in obj

/**
 * Converts an OpenAPI `{param}` path format to FuryStack `:param` format.
 *
 * @param path - The OpenAPI path (e.g. `/users/{id}`)
 * @returns The FuryStack path (e.g. `/users/:id`)
 */
export const convertOpenApiPathToFuryStack = (path: string): string => path.replace(/\{([^}]+)\}/g, ':$1')

/**
 * Extracts the JSON schema from the 200/201 response of an OpenAPI operation.
 */
const extractResponseSchema = (operation: Operation): unknown => {
  for (const statusCode of ['200', '201', '2XX', 'default']) {
    const response = operation.responses?.[statusCode]
    if (!response || isReferenceObject(response)) continue
    const jsonContent = response.content?.['application/json']
    if (jsonContent?.schema) return jsonContent.schema
  }
  return undefined
}

/**
 * Extracts a schema name from an operation (using operationId or generating one from the path).
 */
const extractSchemaName = (operation: Operation, method: string, path: string): string => {
  if (operation.operationId) return operation.operationId
  const cleanPath = path
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/\//g, '_')
    .replace(/^_/, '')
  return `${method}_${cleanPath}`
}

/**
 * Determines if an operation requires authentication based on its security requirements.
 */
const isOperationAuthenticated = (operation: Operation, docSecurity?: OpenApiDocument['security']): boolean => {
  if (operation.security !== undefined) {
    return operation.security.length > 0
  }
  if (docSecurity !== undefined) {
    return docSecurity.length > 0
  }
  return false
}

/**
 * Converts an OpenAPI 3.x document to a FuryStack `ApiEndpointSchema`.
 *
 * This enables consuming external OpenAPI documents with FuryStack's runtime pipeline.
 *
 * @param doc - The OpenAPI document to convert
 * @returns An ApiEndpointSchema that can be used with FuryStack's API tools
 *
 * @example
 * ```typescript
 * import { openApiToSchema } from '@furystack/rest'
 *
 * const schema = openApiToSchema(myOpenApiDoc)
 * // schema.endpoints.GET['/users'] = { path: '/users', schema: {...}, ... }
 * ```
 */
export const openApiToSchema = (doc: OpenApiDocument): ApiEndpointSchema => {
  const endpoints: ApiEndpointSchema['endpoints'] = {}

  if (doc.paths) {
    for (const [openApiPath, pathItemOrRef] of Object.entries(doc.paths)) {
      if (isReferenceObject(pathItemOrRef)) continue
      const pathItem = pathItemOrRef
      const furyStackPath = convertOpenApiPathToFuryStack(openApiPath)

      for (const method of HTTP_METHODS) {
        const operation = pathItem[method]
        if (!operation) continue

        const upperMethod = method.toUpperCase() as Method
        const methodEndpoints = endpoints[upperMethod] ?? {}
        endpoints[upperMethod] = methodEndpoints

        const responseSchema = extractResponseSchema(operation)
        const schemaName = extractSchemaName(operation, method, openApiPath)

        methodEndpoints[furyStackPath] = {
          path: furyStackPath,
          schema: responseSchema ?? {},
          schemaName,
          isAuthenticated: isOperationAuthenticated(operation, doc.security),
        }
      }
    }
  }

  return {
    name: doc.info.title,
    description: doc.info.description ?? '',
    version: doc.info.version,
    endpoints,
  }
}
