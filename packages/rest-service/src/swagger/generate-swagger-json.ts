import type { ApiEndpointDefinition, Operation, ParameterObject, SwaggerDocument } from '@furystack/rest'

/**
 * Converts a FuryStack API schema to an OpenAPI 3.1 compatible document
 *
 * @param schema - The FuryStack API schema to convert
 * @returns A SwaggerDocument in OpenAPI 3.1 format
 */
export const generateSwaggerJsonFromApiSchema = (schema: Record<string, ApiEndpointDefinition>): SwaggerDocument => {
  const swaggerJson: SwaggerDocument = {
    openapi: '3.1.0',
    info: {
      title: 'FuryStack API',
      version: '1.0.0',
      description: 'API documentation generated from FuryStack API schema',
    },
    jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
    servers: [{ url: '/' }],
    tags: [],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
        },
      },
    },
  }

  for (const [path, definition] of Object.entries(schema)) {
    // Normalize path to OpenAPI format (convert :param to {param})
    const normalizedPath = path.replace(/:([^/]+)/g, '{$1}')
    if (!swaggerJson.paths![normalizedPath]) {
      swaggerJson.paths![normalizedPath] = {}
    }

    // Extract path parameters
    const pathParams = Array.from(path.matchAll(/:([^/]+)/g), (m) => m[1])
    const parameters: ParameterObject[] = pathParams.map((param) => ({
      name: param,
      in: 'path',
      required: true,
      description: `Path parameter: ${param}`,
      schema: { type: 'string' },
    }))

    // Build operation
    const method = definition.method.toLowerCase()
    const operation: Operation = {
      summary: `${definition.method} ${path}`,
      description: `Endpoint for ${path}`,
      operationId: `${method}${path.replace(/\//g, '_').replace(/:/g, '').replace(/-/g, '_')}`,
      security: definition.isAuthenticated ? [{ cookieAuth: [] }] : [],
      parameters,
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

    // Add schema to components if not already there
    if (definition.schema && definition.schemaName) {
      swaggerJson.components!.schemas![definition.schemaName] = definition.schema
    }

    // Assign the operation to the correct HTTP method property of PathItem
    const pathItem = swaggerJson.paths![normalizedPath]
    switch (method) {
      case 'get':
        pathItem.get = operation
        break
      case 'put':
        pathItem.put = operation
        break
      case 'post':
        pathItem.post = operation
        break
      case 'delete':
        pathItem.delete = operation
        break
      case 'options':
        pathItem.options = operation
        break
      case 'head':
        pathItem.head = operation
        break
      case 'patch':
        pathItem.patch = operation
        break
      case 'trace':
        pathItem.trace = operation
        break
      default:
        // Ignore unknown methods
        break
    }
  }

  return swaggerJson
}
