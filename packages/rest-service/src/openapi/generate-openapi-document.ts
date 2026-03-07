import type {
  ApiDocumentMetadata,
  ApiEndpointDefinition,
  ApiEndpointSchema,
  Method,
  OpenApiDocument,
  Operation,
  ParameterObject,
  RequestBodyObject,
} from '@furystack/rest'

const PATH_ITEM_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const
type PathItemMethod = (typeof PATH_ITEM_METHODS)[number]

const isPathItemMethod = (method: string): method is PathItemMethod =>
  PATH_ITEM_METHODS.includes(method as PathItemMethod)

type SchemaDefinition = {
  properties?: Record<string, unknown>
  required?: string[]
  [key: string]: unknown
}

type SchemaWithDefinitions = {
  definitions?: Record<string, SchemaDefinition>
  [key: string]: unknown
}

const getSubSchema = (
  schema: unknown,
  schemaName: string,
  property: string,
): { subSchema: unknown; isRequired: boolean } | undefined => {
  const typedSchema = schema as SchemaWithDefinitions | undefined
  if (!typedSchema?.definitions) return undefined

  const definition = typedSchema.definitions[schemaName]
  if (!definition?.properties?.[property]) return undefined

  return {
    subSchema: definition.properties[property],
    isRequired: definition.required?.includes(property) ?? false,
  }
}

/**
 * Converts a FuryStack API schema to an OpenAPI 3.1 compatible document.
 * Preserves metadata from ApiEndpointDefinition and ApiDocumentMetadata when available.
 */
export const generateOpenApiDocument = ({
  api,
  title = 'FuryStack API',
  description = 'API documentation generated from FuryStack API schema',
  version = '1.0.0',
  metadata,
}: {
  api: ApiEndpointSchema['endpoints']
  title?: string
  description?: string
  version?: string
  metadata?: ApiDocumentMetadata
}): OpenApiDocument => {
  const doc: OpenApiDocument = {
    openapi: '3.1.0',
    info: {
      title,
      version,
      description,
      ...(metadata?.summary ? { summary: metadata.summary } : {}),
      ...(metadata?.termsOfService ? { termsOfService: metadata.termsOfService } : {}),
      ...(metadata?.contact ? { contact: metadata.contact } : {}),
      ...(metadata?.license ? { license: metadata.license } : {}),
    },
    jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
    servers: metadata?.servers ?? [{ url: '/' }],
    tags: metadata?.tags ?? [],
    ...(metadata?.externalDocs ? { externalDocs: metadata.externalDocs } : {}),
    paths: {},
    components: {
      schemas: {},
      securitySchemes: metadata?.securitySchemes ?? {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
        },
      },
    },
  }

  for (const [methodKey, paths] of Object.entries(api) as Array<[Method, Record<string, ApiEndpointDefinition>]>) {
    for (const [path, definition] of Object.entries(paths)) {
      const normalizedPath = path.replace(/:([^/]+)/g, '{$1}')
      if (!doc.paths![normalizedPath]) {
        doc.paths![normalizedPath] = {}
      }

      const pathParams = Array.from(path.matchAll(/:([^/]+)/g), (m) => m[1])
      const parameters: ParameterObject[] = pathParams.map((param) => ({
        name: param,
        in: 'path',
        required: true,
        description: `Path parameter: ${param}`,
        schema: { type: 'string' },
      }))

      const queryInfo = getSubSchema(definition.schema, definition.schemaName, 'query')
      if (queryInfo) {
        const querySchema = queryInfo.subSchema as { properties?: Record<string, unknown>; required?: string[] }
        if (querySchema?.properties) {
          for (const [paramName, paramSchema] of Object.entries(querySchema.properties)) {
            parameters.push({
              name: paramName,
              in: 'query',
              required: querySchema.required?.includes(paramName) ?? false,
              schema: paramSchema as object,
            })
          }
        }
      }

      const headerInfo = getSubSchema(definition.schema, definition.schemaName, 'headers')
      if (headerInfo) {
        const headerSchema = headerInfo.subSchema as { properties?: Record<string, unknown>; required?: string[] }
        if (headerSchema?.properties) {
          for (const [headerName, headerParamSchema] of Object.entries(headerSchema.properties)) {
            parameters.push({
              name: headerName,
              in: 'header',
              required: headerSchema.required?.includes(headerName) ?? false,
              schema: headerParamSchema as object,
            })
          }
        }
      }

      const method = methodKey.toLowerCase()
      const operation: Operation = {
        summary: definition.summary ?? `${methodKey} ${path}`,
        description: definition.description ?? `Endpoint for ${path}`,
        operationId: `${method}${path.replace(/\//g, '_').replace(/:/g, '').replace(/-/g, '_')}`,
        security: definition.isAuthenticated ? [{ cookieAuth: [] }] : [],
        parameters,
        ...(definition.tags?.length ? { tags: definition.tags } : {}),
        ...(definition.deprecated ? { deprecated: true } : {}),
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: definition.schemaName
                  ? { $ref: `#/components/schemas/${definition.schemaName}` }
                  : { type: 'object' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal server error' },
        },
      }

      const bodyInfo = getSubSchema(definition.schema, definition.schemaName, 'body')
      if (bodyInfo) {
        const requestBody: RequestBodyObject = {
          required: bodyInfo.isRequired,
          content: {
            'application/json': {
              schema: bodyInfo.subSchema as object,
            },
          },
        }
        operation.requestBody = requestBody
      }

      if (definition.schema && definition.schemaName) {
        doc.components!.schemas![definition.schemaName] = definition.schema
      }

      const pathItem = doc.paths![normalizedPath]
      if (isPathItemMethod(method)) {
        pathItem[method] = operation
      }
    }
  }

  return doc
}

/** @deprecated Use generateOpenApiDocument instead */
export const generateSwaggerJsonFromApiSchema = generateOpenApiDocument
