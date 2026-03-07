import type { OpenApiDocument, OpenApiToRestApi, ParameterObject, ResponseObject, RestApi } from '@furystack/rest'
import { openApiToSchema } from '@furystack/rest'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { generateOpenApiDocument } from './generate-openapi-document.js'
import exampleApiDoc from './openapi-round-trip.example-api.json' with { type: 'json' }
import crudApiDoc from './openapi-round-trip.crud-api.json' with { type: 'json' }

const roundTrip = (doc: OpenApiDocument) => {
  const schema = openApiToSchema(doc)
  return generateOpenApiDocument({
    api: schema.endpoints,
    title: schema.name,
    description: schema.description,
    version: schema.version,
  })
}

describe('OpenAPI round-trip: learn.openapis.org example (imported from JSON)', () => {
  type ExampleApi = OpenApiToRestApi<typeof exampleApiDoc>

  describe('Type-level extraction from JSON import', () => {
    it('Should produce a valid RestApi type', () => {
      expectTypeOf<ExampleApi>().toMatchTypeOf<RestApi>()
    })

    it('Should have GET method with both paths', () => {
      expectTypeOf<ExampleApi['GET']>().toHaveProperty('/')
      expectTypeOf<ExampleApi['GET']>().toHaveProperty('/v2')
    })

    it('Should have unknown result (no schema defined, only examples)', () => {
      expectTypeOf<ExampleApi['GET']['/']['result']>().toEqualTypeOf<unknown>()
      expectTypeOf<ExampleApi['GET']['/v2']['result']>().toEqualTypeOf<unknown>()
    })
  })

  describe('Runtime round-trip from JSON import', () => {
    it('Should satisfy OpenApiDocument at runtime', () => {
      const doc: OpenApiDocument = exampleApiDoc
      expect(doc.openapi).toBe('3.1.0')
    })

    it('Should preserve document info through round-trip', () => {
      const regenerated = roundTrip(exampleApiDoc)
      expect(regenerated.info.title).toBe('Simple API overview')
      expect(regenerated.info.version).toBe('2.0.0')
    })

    it('Should preserve paths through round-trip', () => {
      const regenerated = roundTrip(exampleApiDoc)
      expect(Object.keys(regenerated.paths ?? {}).sort()).toEqual(['/', '/v2'])
    })

    it('Should preserve HTTP methods through round-trip', () => {
      const regenerated = roundTrip(exampleApiDoc)
      expect(regenerated.paths!['/']?.get).toBeDefined()
      expect(regenerated.paths!['/']?.post).toBeUndefined()
      expect(regenerated.paths!['/v2']?.get).toBeDefined()
      expect(regenerated.paths!['/v2']?.post).toBeUndefined()
    })

    it('Should produce valid OpenAPI 3.1 structure', () => {
      const regenerated = roundTrip(exampleApiDoc)
      expect(regenerated.openapi).toBe('3.1.0')
      expect(regenerated.info).toBeDefined()
      expect(regenerated.paths).toBeDefined()
      expect(regenerated.components).toBeDefined()
    })
  })
})

describe('Round-trip: CRUD API (imported from JSON)', () => {
  const typedCrudDoc = crudApiDoc as OpenApiDocument

  describe('Runtime round-trip from JSON import', () => {
    it('Should preserve document info', () => {
      const regenerated = roundTrip(typedCrudDoc)
      expect(regenerated.info.title).toBe('CRUD API')
      expect(regenerated.info.version).toBe('1.0.0')
    })

    it('Should preserve all paths', () => {
      const regenerated = roundTrip(typedCrudDoc)
      expect(Object.keys(regenerated.paths ?? {}).sort()).toEqual(['/users', '/users/{id}'])
    })

    it('Should preserve all HTTP methods', () => {
      const regenerated = roundTrip(typedCrudDoc)
      expect(regenerated.paths!['/users']?.get).toBeDefined()
      expect(regenerated.paths!['/users']?.post).toBeDefined()
      expect(regenerated.paths!['/users/{id}']?.get).toBeDefined()
      expect(regenerated.paths!['/users/{id}']?.delete).toBeDefined()
    })

    it('Should preserve path parameters', () => {
      const regenerated = roundTrip(typedCrudDoc)
      const getParams = regenerated.paths!['/users/{id}']?.get?.parameters as ParameterObject[]
      expect(getParams.some((p) => p.name === 'id' && p.in === 'path')).toBe(true)
    })

    it('Should preserve response schemas', () => {
      const regenerated = roundTrip(typedCrudDoc)
      expect(regenerated.components?.schemas?.listUsers).toEqual(
        crudApiDoc.paths['/users'].get.responses['200'].content['application/json'].schema,
      )
      expect(regenerated.components?.schemas?.createUser).toEqual(
        crudApiDoc.paths['/users'].post.responses['201'].content['application/json'].schema,
      )
    })
  })
})

describe('Round-trip: individual construct tests', () => {
  describe('Response schema', () => {
    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            operationId: 'listUsers',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    } as const satisfies OpenApiDocument

    type Api = OpenApiToRestApi<typeof doc>

    it('Should extract typed response at the type level', () => {
      expectTypeOf<Api['GET']['/users']['result']>().toMatchTypeOf<Array<{ id?: string; name?: string }>>()
    })

    it('Should preserve response schema through round-trip', () => {
      const regenerated = roundTrip(doc)
      expect(regenerated.components?.schemas?.listUsers).toEqual(
        doc.paths['/users'].get.responses['200'].content['application/json'].schema,
      )
    })
  })

  describe('Path parameters', () => {
    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users/{userId}/posts/{postId}': {
          get: {
            parameters: [
              { name: 'userId', in: 'path' as const, required: true, schema: { type: 'string' } },
              { name: 'postId', in: 'path' as const, required: true, schema: { type: 'string' } },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    } as const satisfies OpenApiDocument

    type Api = OpenApiToRestApi<typeof doc>

    it('Should extract path params at the type level', () => {
      type Url = Api['GET']['/users/:userId/posts/:postId']['url']
      expectTypeOf<Url>().toHaveProperty('userId')
      expectTypeOf<Url>().toHaveProperty('postId')
    })

    it('Should convert {param} to :param and back through round-trip', () => {
      const regenerated = roundTrip(doc)
      expect(regenerated.paths?.['/users/{userId}/posts/{postId}']).toBeDefined()
      const params = regenerated.paths?.['/users/{userId}/posts/{postId}']?.get?.parameters as ParameterObject[]
      expect(params.some((p) => p.name === 'userId' && p.in === 'path')).toBe(true)
      expect(params.some((p) => p.name === 'postId' && p.in === 'path')).toBe(true)
    })
  })

  describe('Request body', () => {
    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users': {
          post: {
            operationId: 'createUser',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { name: { type: 'string' }, email: { type: 'string' } },
                    required: ['name', 'email'],
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { id: { type: 'string' } } },
                  },
                },
              },
            },
          },
        },
      },
    } as const satisfies OpenApiDocument

    type Api = OpenApiToRestApi<typeof doc>

    it('Should extract request body type', () => {
      expectTypeOf<Api['POST']['/users']['body']>().toMatchTypeOf<{ name: string; email: string }>()
    })

    it('Should extract response type from 201', () => {
      expectTypeOf<Api['POST']['/users']['result']>().toMatchTypeOf<{ id?: string }>()
    })
  })

  describe('Query parameters', () => {
    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/search': {
          get: {
            parameters: [
              { name: 'q', in: 'query' as const, schema: { type: 'string' } },
              { name: 'limit', in: 'query' as const, schema: { type: 'integer' } },
            ],
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } },
              },
            },
          },
        },
      },
    } as const satisfies OpenApiDocument

    type Api = OpenApiToRestApi<typeof doc>

    it('Should extract query params at the type level', () => {
      type Query = Api['GET']['/search']['query']
      expectTypeOf<Query>().toHaveProperty('q')
      expectTypeOf<Query>().toHaveProperty('limit')
    })

    it('Should preserve result type', () => {
      expectTypeOf<Api['GET']['/search']['result']>().toMatchTypeOf<string[]>()
    })
  })

  describe('Authentication', () => {
    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/public': {
          get: { security: [], responses: { '200': { description: 'OK' } } },
        },
        '/private': {
          get: { security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } },
        },
      },
    } as const satisfies OpenApiDocument

    it('Should preserve authentication through openApiToSchema', () => {
      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/public'].isAuthenticated).toBe(false)
      expect(schema.endpoints.GET!['/private'].isAuthenticated).toBe(true)
    })

    it('Should map authentication to security in regenerated doc', () => {
      const regenerated = roundTrip(doc)
      expect(regenerated.paths?.['/public']?.get?.security).toEqual([])
      expect(regenerated.paths?.['/private']?.get?.security).toEqual([{ cookieAuth: [] }])
    })
  })

  describe('HEAD, OPTIONS, TRACE methods', () => {
    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/items': {
          head: { responses: { '200': { description: 'OK' } } },
          options: { responses: { '200': { description: 'OK' } } },
          trace: { responses: { '200': { description: 'OK' } } },
        },
      },
    } as const satisfies OpenApiDocument

    it('Should preserve HEAD, OPTIONS, TRACE through round-trip', () => {
      const regenerated = roundTrip(doc)
      expect(regenerated.paths?.['/items']?.head).toBeDefined()
      expect(regenerated.paths?.['/items']?.options).toBeDefined()
      expect(regenerated.paths?.['/items']?.trace).toBeDefined()
    })
  })

  describe('No response schema', () => {
    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/health': {
          get: { responses: { '200': { description: 'OK' } } },
        },
      },
    } as const satisfies OpenApiDocument

    type Api = OpenApiToRestApi<typeof doc>

    it('Should have unknown result type', () => {
      expectTypeOf<Api['GET']['/health']['result']>().toEqualTypeOf<unknown>()
    })

    it('Should still produce the endpoint in the round-trip', () => {
      const regenerated = roundTrip(doc)
      expect(regenerated.paths?.['/health']?.get).toBeDefined()
      const response = regenerated.paths?.['/health']?.get?.responses?.['200'] as ResponseObject
      expect(response).toBeDefined()
    })
  })
})
