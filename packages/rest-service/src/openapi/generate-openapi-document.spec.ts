import type {
  ApiEndpointSchema,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
} from '@furystack/rest'
import { describe, expect, it } from 'vitest'
import { generateOpenApiDocument } from './generate-openapi-document.js'

describe('generateOpenApiDocument', () => {
  describe('Document structure', () => {
    it('Should generate a valid OpenAPI 3.1 document', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/test': { path: '/test', isAuthenticated: false, schemaName: 'Test', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })

      expect(result.openapi).toBe('3.1.0')
      expect(result.info.title).toBe('FuryStack API')
      expect(result.info.version).toBe('1.0.0')
      expect(result.info.description).toBe('API documentation generated from FuryStack API schema')
      expect(result.jsonSchemaDialect).toBe('https://spec.openapis.org/oas/3.1/dialect/base')
      expect(result.servers).toEqual([{ url: '/' }])
      expect(result.tags).toEqual([])
      expect(result.paths).toBeDefined()
      expect(result.components).toBeDefined()
    })

    it('Should use custom title, description, and version', () => {
      const result = generateOpenApiDocument({
        api: {},
        title: 'Custom API',
        description: 'Custom description',
        version: '3.0.0',
      })

      expect(result.info.title).toBe('Custom API')
      expect(result.info.description).toBe('Custom description')
      expect(result.info.version).toBe('3.0.0')
    })

    it('Should include cookieAuth security scheme', () => {
      const result = generateOpenApiDocument({ api: {} })

      expect(result.components?.securitySchemes?.cookieAuth).toEqual({
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
      })
    })
  })

  describe('HTTP methods', () => {
    it('Should generate GET operations', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: { '/items': { path: '/items', isAuthenticated: false, schemaName: 'Items', schema: { type: 'array' } } },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items']?.get).toBeDefined()
    })

    it('Should generate POST operations', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        POST: { '/items': { path: '/items', isAuthenticated: false, schemaName: 'Item', schema: { type: 'object' } } },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items']?.post).toBeDefined()
    })

    it('Should generate PUT operations', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        PUT: {
          '/items/:id': {
            path: '/items/:id',
            isAuthenticated: false,
            schemaName: 'Item',
            schema: { type: 'object' },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items/{id}']?.put).toBeDefined()
    })

    it('Should generate DELETE operations', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        DELETE: {
          '/items/:id': {
            path: '/items/:id',
            isAuthenticated: false,
            schemaName: 'Item',
            schema: { type: 'object' },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items/{id}']?.delete).toBeDefined()
    })

    it('Should generate PATCH operations', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        PATCH: {
          '/items/:id': {
            path: '/items/:id',
            isAuthenticated: false,
            schemaName: 'Item',
            schema: { type: 'object' },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items/{id}']?.patch).toBeDefined()
    })

    it('Should generate HEAD operations', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        HEAD: { '/items': { path: '/items', isAuthenticated: false, schemaName: 'Items', schema: { type: 'object' } } },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items']?.head).toBeDefined()
    })

    it('Should generate OPTIONS operations', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        OPTIONS: {
          '/items': { path: '/items', isAuthenticated: false, schemaName: 'Items', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items']?.options).toBeDefined()
    })

    it('Should generate TRACE operations', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        TRACE: {
          '/items': { path: '/items', isAuthenticated: false, schemaName: 'Items', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items']?.trace).toBeDefined()
    })

    it('Should handle multiple methods on the same path', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/resource': {
            path: '/resource',
            isAuthenticated: false,
            schemaName: 'ResourceGet',
            schema: { type: 'object' },
          },
        },
        POST: {
          '/resource': {
            path: '/resource',
            isAuthenticated: true,
            schemaName: 'ResourcePost',
            schema: { type: 'object' },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/resource']?.get).toBeDefined()
      expect(result.paths?.['/resource']?.post).toBeDefined()
    })
  })

  describe('Path parameters', () => {
    it('Should convert :param to {param} in paths', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/users/:id': {
            path: '/users/:id',
            isAuthenticated: false,
            schemaName: 'User',
            schema: { type: 'object' },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/users/{id}']).toBeDefined()
      expect(result.paths?.['/users/:id']).toBeUndefined()
    })

    it('Should generate path parameter objects', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/users/:id': {
            path: '/users/:id',
            isAuthenticated: false,
            schemaName: 'User',
            schema: { type: 'object' },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const params = result.paths?.['/users/{id}']?.get?.parameters as ParameterObject[]
      expect(params).toHaveLength(1)
      expect(params[0]).toEqual({
        name: 'id',
        in: 'path',
        required: true,
        description: 'Path parameter: id',
        schema: { type: 'string' },
      })
    })

    it('Should generate multiple path parameters', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/users/:userId/posts/:postId': {
            path: '/users/:userId/posts/:postId',
            isAuthenticated: false,
            schemaName: 'Post',
            schema: { type: 'object' },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const params = result.paths?.['/users/{userId}/posts/{postId}']?.get?.parameters as ParameterObject[]
      expect(params).toHaveLength(2)
      expect(params[0].name).toBe('userId')
      expect(params[1].name).toBe('postId')
    })
  })

  describe('Response schemas', () => {
    it('Should reference schema via $ref when schemaName is set', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/test': {
            path: '/test',
            isAuthenticated: false,
            schemaName: 'TestModel',
            schema: { type: 'object', properties: { id: { type: 'string' } } },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const response = result.paths?.['/test']?.get?.responses?.['200'] as ResponseObject
      expect((response.content?.['application/json']?.schema as ReferenceObject).$ref).toBe(
        '#/components/schemas/TestModel',
      )
    })

    it('Should include schemas in components', () => {
      const testSchema = { type: 'object', properties: { id: { type: 'string' } } }
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/test': { path: '/test', isAuthenticated: false, schemaName: 'TestModel', schema: testSchema },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.components?.schemas?.TestModel).toEqual(testSchema)
    })

    it('Should use generic object schema when no schemaName', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/test': { path: '/test', isAuthenticated: false, schemaName: '', schema: null as unknown },
        },
      }

      const result = generateOpenApiDocument({ api })
      const response = result.paths?.['/test']?.get?.responses?.['200'] as ResponseObject
      expect(response.content?.['application/json']?.schema).toEqual({ type: 'object' })
    })

    it('Should include 401 and 500 error responses', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/test': { path: '/test', isAuthenticated: false, schemaName: 'Test', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })
      const responses = result.paths?.['/test']?.get?.responses as Record<string, ResponseObject>
      expect(responses['401'].description).toBe('Unauthorized')
      expect(responses['500'].description).toBe('Internal server error')
    })

    it('Should not add schema to components when schema is falsy', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/test': { path: '/test', isAuthenticated: false, schemaName: 'Empty', schema: null as unknown },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.components?.schemas?.Empty).toBeUndefined()
    })
  })

  describe('Request body extraction', () => {
    it('Should include request body from schema definitions', () => {
      const bodySchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] }

      const api: ApiEndpointSchema['endpoints'] = {
        POST: {
          '/users': {
            path: '/users',
            isAuthenticated: false,
            schemaName: 'CreateUser',
            schema: {
              definitions: {
                CreateUser: {
                  type: 'object',
                  properties: { body: bodySchema, result: { type: 'object' } },
                  required: ['body', 'result'],
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const requestBody = result.paths?.['/users']?.post?.requestBody as RequestBodyObject
      expect(requestBody).toBeDefined()
      expect(requestBody.required).toBe(true)
      expect(requestBody.content['application/json'].schema).toEqual(bodySchema)
    })

    it('Should mark request body as not required when body is optional in schema', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        POST: {
          '/items': {
            path: '/items',
            isAuthenticated: false,
            schemaName: 'CreateItem',
            schema: {
              definitions: {
                CreateItem: {
                  type: 'object',
                  properties: { body: { type: 'object' }, result: { type: 'object' } },
                  required: ['result'],
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const requestBody = result.paths?.['/items']?.post?.requestBody as RequestBodyObject
      expect(requestBody.required).toBe(false)
    })

    it('Should not add request body when schema has no body property', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/items': {
            path: '/items',
            isAuthenticated: false,
            schemaName: 'ListItems',
            schema: {
              definitions: {
                ListItems: {
                  type: 'object',
                  properties: { result: { type: 'array' } },
                  required: ['result'],
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items']?.get?.requestBody).toBeUndefined()
    })

    it('Should not add request body when schema has no definitions', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        POST: {
          '/items': { path: '/items', isAuthenticated: false, schemaName: 'Item', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/items']?.post?.requestBody).toBeUndefined()
    })
  })

  describe('Query parameter extraction', () => {
    it('Should include query parameters from schema definitions', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/search': {
            path: '/search',
            isAuthenticated: false,
            schemaName: 'Search',
            schema: {
              definitions: {
                Search: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'object',
                      properties: { q: { type: 'string' }, limit: { type: 'number' } },
                      required: ['q'],
                    },
                    result: { type: 'array' },
                  },
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const params = result.paths?.['/search']?.get?.parameters as ParameterObject[]
      const queryParams = params.filter((p) => p.in === 'query')

      expect(queryParams).toHaveLength(2)
      expect(queryParams.find((p) => p.name === 'q')?.required).toBe(true)
      expect(queryParams.find((p) => p.name === 'q')?.schema).toEqual({ type: 'string' })
      expect(queryParams.find((p) => p.name === 'limit')?.required).toBe(false)
      expect(queryParams.find((p) => p.name === 'limit')?.schema).toEqual({ type: 'number' })
    })

    it('Should not add query parameters when query has no properties', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/items': {
            path: '/items',
            isAuthenticated: false,
            schemaName: 'Items',
            schema: {
              definitions: {
                Items: {
                  type: 'object',
                  properties: { query: { type: 'object' }, result: { type: 'array' } },
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const params = result.paths?.['/items']?.get?.parameters as ParameterObject[]
      expect(params.filter((p) => p.in === 'query')).toHaveLength(0)
    })

    it('Should mark query params as not required when required array is missing', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/search': {
            path: '/search',
            isAuthenticated: false,
            schemaName: 'Search',
            schema: {
              definitions: {
                Search: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'object',
                      properties: { q: { type: 'string' } },
                    },
                    result: { type: 'array' },
                  },
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const params = result.paths?.['/search']?.get?.parameters as ParameterObject[]
      const qParam = params.find((p) => p.in === 'query' && p.name === 'q')
      expect(qParam?.required).toBe(false)
    })
  })

  describe('Header parameter extraction', () => {
    it('Should include header parameters from schema definitions', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/data': {
            path: '/data',
            isAuthenticated: false,
            schemaName: 'GetData',
            schema: {
              definitions: {
                GetData: {
                  type: 'object',
                  properties: {
                    headers: {
                      type: 'object',
                      properties: { 'x-api-key': { type: 'string' } },
                      required: ['x-api-key'],
                    },
                    result: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const params = result.paths?.['/data']?.get?.parameters as ParameterObject[]
      const headerParams = params.filter((p) => p.in === 'header')

      expect(headerParams).toHaveLength(1)
      expect(headerParams[0].name).toBe('x-api-key')
      expect(headerParams[0].required).toBe(true)
      expect(headerParams[0].schema).toEqual({ type: 'string' })
    })

    it('Should not add header parameters when headers has no properties', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/data': {
            path: '/data',
            isAuthenticated: false,
            schemaName: 'GetData',
            schema: {
              definitions: {
                GetData: {
                  type: 'object',
                  properties: { headers: { type: 'object' }, result: { type: 'object' } },
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const params = result.paths?.['/data']?.get?.parameters as ParameterObject[]
      expect(params.filter((p) => p.in === 'header')).toHaveLength(0)
    })

    it('Should mark header params as not required when required array is missing', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/data': {
            path: '/data',
            isAuthenticated: false,
            schemaName: 'GetData',
            schema: {
              definitions: {
                GetData: {
                  type: 'object',
                  properties: {
                    headers: {
                      type: 'object',
                      properties: { 'x-token': { type: 'string' } },
                    },
                    result: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      const params = result.paths?.['/data']?.get?.parameters as ParameterObject[]
      const headerParam = params.find((p) => p.in === 'header' && p.name === 'x-token')
      expect(headerParam?.required).toBe(false)
    })
  })

  describe('Security', () => {
    it('Should add cookieAuth for authenticated endpoints', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/private': { path: '/private', isAuthenticated: true, schemaName: 'P', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/private']?.get?.security).toEqual([{ cookieAuth: [] }])
    })

    it('Should use empty security for non-authenticated endpoints', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/public': { path: '/public', isAuthenticated: false, schemaName: 'P', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/public']?.get?.security).toEqual([])
    })

    it('Should use stored securitySchemes names when available', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/private': {
            path: '/private',
            isAuthenticated: true,
            schemaName: 'P',
            schema: { type: 'object' },
            securitySchemes: ['bearerAuth'],
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/private']?.get?.security).toEqual([{ bearerAuth: [] }])
    })

    it('Should use multiple stored securitySchemes names', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/private': {
            path: '/private',
            isAuthenticated: true,
            schemaName: 'P',
            schema: { type: 'object' },
            securitySchemes: ['bearerAuth', 'apiKey'],
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/private']?.get?.security).toEqual([{ bearerAuth: [] }, { apiKey: [] }])
    })

    it('Should use metadata securitySchemes keys as default when isAuthenticated is true', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/private': { path: '/private', isAuthenticated: true, schemaName: 'P', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({
        api,
        metadata: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          },
        },
      })
      expect(result.paths?.['/private']?.get?.security).toEqual([{ bearerAuth: [] }, { apiKey: [] }])
    })

    it('Should prefer stored securitySchemes over metadata-derived defaults', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/private': {
            path: '/private',
            isAuthenticated: true,
            schemaName: 'P',
            schema: { type: 'object' },
            securitySchemes: ['customScheme'],
          },
        },
      }

      const result = generateOpenApiDocument({
        api,
        metadata: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer' },
          },
        },
      })
      expect(result.paths?.['/private']?.get?.security).toEqual([{ customScheme: [] }])
    })
  })

  describe('Operation metadata', () => {
    it('Should generate operationId from method and path', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        GET: {
          '/api/users/:id/profile': {
            path: '/api/users/:id/profile',
            isAuthenticated: false,
            schemaName: 'P',
            schema: { type: 'object' },
          },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/api/users/{id}/profile']?.get?.operationId).toBe('get_api_users_id_profile')
    })

    it('Should gracefully ignore unsupported HTTP methods like CONNECT', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        CONNECT: {
          '/tunnel': { path: '/tunnel', isAuthenticated: false, schemaName: 'Tunnel', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/tunnel']).toBeDefined()
      expect(result.paths?.['/tunnel']?.get).toBeUndefined()
      expect(result.paths?.['/tunnel']?.post).toBeUndefined()
    })

    it('Should generate summary and description', () => {
      const api: ApiEndpointSchema['endpoints'] = {
        POST: {
          '/users': { path: '/users', isAuthenticated: false, schemaName: 'U', schema: { type: 'object' } },
        },
      }

      const result = generateOpenApiDocument({ api })
      expect(result.paths?.['/users']?.post?.summary).toBe('POST /users')
      expect(result.paths?.['/users']?.post?.description).toBe('Endpoint for /users')
    })
  })
})
