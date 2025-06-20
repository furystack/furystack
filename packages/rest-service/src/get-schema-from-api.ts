import type { Method, RestApi } from '@furystack/rest'
import type { RestApiImplementation } from './api-manager.js'
import type { RequestAction } from './request-action-implementation.js'

export type Schema = unknown // TODO: Fix me

export type ApiEndpointDefinition = {
  method: Method
  path: string
  schema: Schema
  schemaName: string
}

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

const getDefinitionFromAction = (method: Method, path: string, action: RequestAction<any>): ApiEndpointDefinition => {
  return {
    method,
    path,
    schema: 'schema' in action && typeof action.schema === 'object' ? action.schema : defaultSchema,
    schemaName: 'schemaName' in action && typeof action.schemaName === 'string' ? action.schemaName : defaultSchemaName,
  }
}

export const getApiFromSchema = <T extends RestApiImplementation<RestApi>>(
  schema: T,
): Record<string, ApiEndpointDefinition> => {
  const api: Record<string, ApiEndpointDefinition> = {}

  Object.entries(schema).forEach(([method, endpoints]) => {
    Object.entries(endpoints as Record<string, RequestAction<any>>).forEach(([url, requestAction]) => {
      api[url] = getDefinitionFromAction(method as Method, url, requestAction)
    })
  })

  return api
}
