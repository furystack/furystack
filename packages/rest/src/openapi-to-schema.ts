import type { ApiDocumentMetadata, ApiEndpointSchema } from './api-endpoint-schema.js'
import type { Method } from './methods.js'
import type { OpenApiDocument, Operation, ReferenceObject, SecuritySchemeObject } from './openapi-document.js'

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'] as const

const isReferenceObject = (obj: unknown): obj is ReferenceObject =>
  typeof obj === 'object' && obj !== null && '$ref' in obj

/**
 * Converts an OpenAPI `{param}` path format to FuryStack `:param` format.
 *
 * @param path - The OpenAPI path (e.g. `/users/{id}`)
 * @returns The FuryStack path (e.g. `/users/:id`)
 */
export const convertOpenApiPathToFuryStack = (path: string): string => path.replace(/\{([^{}]+)\}/g, ':$1')

const extractResponseSchema = (operation: Operation): unknown => {
  for (const statusCode of ['200', '201', '2XX', 'default']) {
    const response = operation.responses?.[statusCode]
    if (!response || isReferenceObject(response)) continue
    const jsonContent = response.content?.['application/json']
    if (jsonContent?.schema) return jsonContent.schema
  }
  return undefined
}

const extractSchemaName = (operation: Operation, method: string, path: string): string => {
  if (operation.operationId) return operation.operationId
  const cleanPath = path
    .replace(/\{([^{}]+)\}/g, '$1')
    .replace(/\//g, '_')
    .replace(/^_/, '')
  return `${method}_${cleanPath}`
}

const isOperationAuthenticated = (operation: Operation, docSecurity?: OpenApiDocument['security']): boolean => {
  if (operation.security !== undefined) {
    return operation.security.length > 0
  }
  if (docSecurity !== undefined) {
    return docSecurity.length > 0
  }
  return false
}

const extractDocumentMetadata = (doc: OpenApiDocument): ApiDocumentMetadata | undefined => {
  const metadata: ApiDocumentMetadata = {}
  let hasMetadata = false

  if (doc.info.summary) {
    metadata.summary = doc.info.summary
    hasMetadata = true
  }
  if (doc.info.termsOfService) {
    metadata.termsOfService = doc.info.termsOfService
    hasMetadata = true
  }
  if (doc.info.contact) {
    metadata.contact = doc.info.contact
    hasMetadata = true
  }
  if (doc.info.license) {
    metadata.license = doc.info.license
    hasMetadata = true
  }
  if (doc.servers?.length) {
    metadata.servers = doc.servers
    hasMetadata = true
  }
  if (doc.tags?.length) {
    metadata.tags = doc.tags
    hasMetadata = true
  }
  if (doc.externalDocs) {
    metadata.externalDocs = doc.externalDocs
    hasMetadata = true
  }
  const schemes = doc.components?.securitySchemes
  if (schemes) {
    const resolved: Record<string, SecuritySchemeObject> = {}
    for (const [name, scheme] of Object.entries(schemes)) {
      if (!isReferenceObject(scheme)) {
        resolved[name] = scheme
      }
    }
    if (Object.keys(resolved).length > 0) {
      metadata.securitySchemes = resolved
      hasMetadata = true
    }
  }

  return hasMetadata ? metadata : undefined
}

/**
 * Converts an OpenAPI 3.x document to a FuryStack `ApiEndpointSchema`.
 *
 * This enables consuming external OpenAPI documents with FuryStack's runtime pipeline.
 * Preserves operation-level metadata (tags, deprecated, summary, description) and
 * document-level metadata (servers, tags, contact, license, securitySchemes).
 *
 * @param doc - The OpenAPI document to convert
 * @returns An ApiEndpointSchema that can be used with FuryStack's API tools
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
          ...(operation.tags?.length ? { tags: operation.tags } : {}),
          ...(operation.deprecated ? { deprecated: true } : {}),
          ...(operation.summary ? { summary: operation.summary } : {}),
          ...(operation.description ? { description: operation.description } : {}),
        }
      }
    }
  }

  return {
    name: doc.info.title,
    description: doc.info.description ?? '',
    version: doc.info.version,
    metadata: extractDocumentMetadata(doc),
    endpoints,
  }
}
