import type { ApiEndpointDefinition, SwaggerDocument } from '@furystack/rest'

/**
 * Converts a FuryStack API schema to an OpenAPI 3.0 compatible document
 *
 * @param schema - The FuryStack API schema to convert
 * @returns A SwaggerDocument in OpenAPI 3.0 format
 */
export const generateSwaggerJsonFromApiSchema = (schema: Record<string, ApiEndpointDefinition>): SwaggerDocument => {
  // Create OpenAPI 3.0 structure
  const swaggerJson: SwaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'FuryStack API',
      version: '1.0.0',
      description: 'API documentation generated from FuryStack API schema',
    },
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session', // The name of your cookie
        },
      },
    },
  }

  // Process each endpoint
  Object.entries(schema).forEach(([path, definition]) => {
    // Normalize path to OpenAPI format (convert route parameters)
    // FuryStack typically uses :paramName format, OpenAPI uses {paramName}
    const normalizedPath = path.replace(/:([^/]+)/g, '{$1}')

    // Initialize path object if it doesn't exist - this is for test coverage
    if (!swaggerJson.paths[normalizedPath]) {
      swaggerJson.paths[normalizedPath] = {}
    }

    // Add the method details
    const method = definition.method.toLowerCase()
    swaggerJson.paths[normalizedPath][method] = {
      summary: `${definition.method} ${path}`,
      description: `Endpoint for ${path}`,
      operationId: `${method}${path.replace(/\//g, '_').replace(/:/g, '').replace(/-/g, '_')}`,
      security: definition.isAuthenticated ? [{ cookieAuth: [] }] : [],
      parameters: [],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${definition.schemaName}`,
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized',
        },
        '500': {
          description: 'Internal server error',
        },
      },
    }

    // Extract path parameters
    const pathParams = path.match(/:([^/]+)/g)
    if (pathParams) {
      pathParams.forEach((param) => {
        const paramName = param.substring(1) // Remove the ':'
        swaggerJson.paths[normalizedPath][method].parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          description: `Path parameter: ${paramName}`,
          schema: {
            type: 'string',
          },
        })
      })
    }

    // Add schema to components if not already there
    if (definition.schema && definition.schemaName) {
      swaggerJson.components.schemas[definition.schemaName] = definition.schema
    }
  })

  return swaggerJson
}
