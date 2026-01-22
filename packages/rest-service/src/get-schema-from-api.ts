import type { ApiEndpointDefinition, ApiEndpointSchema, Method, RestApi, Schema } from '@furystack/rest'
import type { RestApiImplementation } from './api-manager.js'
import type { RequestAction } from './request-action-implementation.js'

export const defaultSchema: Schema = {
  definitions: {
    default: {
      type: 'object',
      properties: {
        headers: {
          type: 'object',
          additionalProperties: true,
        },
        query: {
          type: 'object',
          additionalProperties: true,
        },
        body: {
          type: 'object',
          additionalProperties: true,
        },
        url: {
          type: 'object',
          additionalProperties: true,
        },
      },
      required: [],
      description: 'Default schema for API endpoints',
      additionalProperties: true,
    },
  },
}

const defaultSchemaName = 'default'

const getDefinitionFromAction = (path: string, action: RequestAction<{ result: unknown }>): ApiEndpointDefinition => {
  return {
    path,
    schema: 'schema' in action && typeof action.schema === 'object' ? action.schema : defaultSchema,
    schemaName: 'schemaName' in action && typeof action.schemaName === 'string' ? action.schemaName : defaultSchemaName,
    isAuthenticated:
      'isAuthenticated' in action && typeof action.isAuthenticated === 'boolean' ? action.isAuthenticated : false,
  }
}

export const getSchemaFromApi = <T extends RestApiImplementation<RestApi>>({
  api,
  name = 'FuryStack API',
  description = 'API documentation generated from FuryStack API schema',
  version = '1.0.0',
}: {
  api: T
  name?: string
  description?: string
  version?: string
}): ApiEndpointSchema => {
  const endpoints: ApiEndpointSchema['endpoints'] = {}

  Object.entries(api).forEach(([method, endpointList]) => {
    const methodKey = method as Method
    if (!endpoints[methodKey]) {
      endpoints[methodKey] = {}
    }
    Object.entries(endpointList as Record<string, RequestAction<{ result: unknown }>>).forEach(
      ([url, requestAction]) => {
        if (method && url && requestAction) {
          endpoints[methodKey]![url] = getDefinitionFromAction(url, requestAction)
        }
      },
    )
  })

  return {
    name,
    description,
    version,
    endpoints,
  }
}
