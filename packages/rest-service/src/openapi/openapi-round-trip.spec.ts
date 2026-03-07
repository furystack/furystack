import type { OpenApiDocument, OpenApiToRestApi, ParameterObject, ResponseObject, RestApi } from '@furystack/rest'
import { openApiToSchema, resolveOpenApiRefs } from '@furystack/rest'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { generateOpenApiDocument } from './generate-openapi-document.js'
import exampleApiDoc from './openapi-round-trip.example-api.json' with { type: 'json' }
import crudApiDoc from './openapi-round-trip.crud-api.json' with { type: 'json' }
import advancedApiDoc from './openapi-round-trip.advanced-api.json' with { type: 'json' }

const roundTrip = (doc: OpenApiDocument) => {
  const schema = openApiToSchema(doc)
  return generateOpenApiDocument({
    api: schema.endpoints,
    title: schema.name,
    description: schema.description,
    version: schema.version,
    metadata: schema.metadata,
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

// ─── Advanced API round-trip ─────────────────────────────────────────────────

describe('Round-trip: advanced API (imported from JSON)', () => {
  const resolvedDoc = resolveOpenApiRefs(advancedApiDoc as OpenApiDocument)

  const advancedRoundTrip = (doc: OpenApiDocument) => {
    const resolved = resolveOpenApiRefs(doc)
    const schema = openApiToSchema(resolved)
    return generateOpenApiDocument({
      api: schema.endpoints,
      title: schema.name,
      description: schema.description,
      version: schema.version,
      metadata: schema.metadata,
    })
  }

  describe('$ref resolution', () => {
    it('Should resolve $ref in response schemas', () => {
      const getPetResp = resolvedDoc.paths?.['/pets/{petId}']?.get?.responses?.['200'] as Record<string, unknown>
      const content = getPetResp.content as Record<string, { schema: Record<string, unknown> }>
      const { schema } = content['application/json']
      expect(schema.allOf).toBeDefined()
    })

    it('Should resolve $ref parameters from components', () => {
      const params = resolvedDoc.paths?.['/pets']?.get?.parameters as Array<Record<string, unknown>>
      const limitParam = params.find((p) => p.name === 'limit')
      expect(limitParam).toBeDefined()
      expect(limitParam?.in).toBe('query')
    })

    it('Should resolve $ref in request body schemas', () => {
      const body = resolvedDoc.paths?.['/pets']?.post?.requestBody as Record<string, unknown>
      const content = body.content as Record<string, { schema: Record<string, unknown> }>
      const { schema } = content['application/json']
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
    })

    it('Should resolve nested $ref within allOf', () => {
      const petSchema = resolvedDoc.components?.schemas?.Pet as Record<string, unknown>
      const allOfItems = petSchema.allOf as Array<Record<string, unknown>>
      const firstItem = allOfItems[0]
      expect(firstItem.type).toBe('object')
      expect(firstItem.properties).toBeDefined()
    })
  })

  describe('Document-level metadata round-trip', () => {
    it('Should preserve info fields', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.info.title).toBe('Advanced Pet Store API')
      expect(regenerated.info.version).toBe('2.1.0')
      expect(regenerated.info.description).toBe('A feature-rich API exercising all OpenAPI 3.1 constructs')
      expect(regenerated.info.summary).toBe('Pet store with advanced features')
      expect(regenerated.info.termsOfService).toBe('https://example.com/terms')
    })

    it('Should preserve contact info', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.info.contact).toEqual({
        name: 'API Support',
        url: 'https://example.com/support',
        email: 'support@example.com',
      })
    })

    it('Should preserve license info', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.info.license).toEqual({ name: 'MIT', identifier: 'MIT' })
    })

    it('Should preserve servers with variables', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.servers).toHaveLength(1)
      expect(regenerated.servers?.[0].url).toBe('https://{environment}.example.com/api/{version}')
      expect(regenerated.servers?.[0].variables?.environment?.default).toBe('production')
    })

    it('Should preserve tags', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.tags).toHaveLength(2)
      expect(regenerated.tags?.find((t) => t.name === 'pets')).toBeDefined()
      expect(regenerated.tags?.find((t) => t.name === 'store')?.externalDocs?.url).toBe(
        'https://example.com/docs/store',
      )
    })

    it('Should preserve externalDocs', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.externalDocs).toEqual({
        description: 'Full documentation',
        url: 'https://example.com/docs',
      })
    })

    it('Should preserve security schemes', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.components?.securitySchemes?.bearerAuth).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })
      expect(regenerated.components?.securitySchemes?.apiKey).toBeDefined()
    })
  })

  describe('Operation metadata round-trip', () => {
    it('Should preserve operation summary and description', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.paths?.['/pets']?.get?.summary).toBe('List all pets')
      expect(regenerated.paths?.['/pets']?.get?.description).toBe(
        'Returns a paginated list of pets with optional filtering',
      )
    })

    it('Should preserve operation tags', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.paths?.['/pets']?.get?.tags).toEqual(['pets'])
      expect(regenerated.paths?.['/store/inventory']?.get?.tags).toEqual(['store'])
    })

    it('Should preserve deprecated flag', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.paths?.['/pets/{petId}']?.delete?.deprecated).toBe(true)
    })

    it('Should preserve authentication: public override with empty security', () => {
      const schema = openApiToSchema(resolvedDoc)
      expect(schema.endpoints.GET?.['/pets']?.isAuthenticated).toBe(false)
    })

    it('Should preserve authentication: inherited from document-level security', () => {
      const schema = openApiToSchema(resolvedDoc)
      expect(schema.endpoints.GET?.['/pets/:petId']?.isAuthenticated).toBe(true)
    })
  })

  describe('Structural round-trip', () => {
    it('Should preserve all paths', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      const paths = Object.keys(regenerated.paths ?? {}).sort()
      expect(paths).toEqual(['/pets', '/pets/{petId}', '/store/inventory', '/store/orders'])
    })

    it('Should preserve all HTTP methods per path', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      expect(regenerated.paths?.['/pets']?.get).toBeDefined()
      expect(regenerated.paths?.['/pets']?.post).toBeDefined()
      expect(regenerated.paths?.['/pets/{petId}']?.get).toBeDefined()
      expect(regenerated.paths?.['/pets/{petId}']?.patch).toBeDefined()
      expect(regenerated.paths?.['/pets/{petId}']?.delete).toBeDefined()
      expect(regenerated.paths?.['/store/inventory']?.get).toBeDefined()
      expect(regenerated.paths?.['/store/orders']?.post).toBeDefined()
    })

    it('Should preserve path parameters', () => {
      const regenerated = advancedRoundTrip(advancedApiDoc as OpenApiDocument)
      const params = regenerated.paths?.['/pets/{petId}']?.get?.parameters as ParameterObject[]
      expect(params.some((p) => p.name === 'petId' && p.in === 'path')).toBe(true)
    })
  })

  describe('Type-level extraction (as const inline subset)', () => {
    const typedDoc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            tags: ['pets'],
            summary: 'List all pets',
            description: 'Returns a list of pets',
            security: [],
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { name: { type: 'string' } } },
                  },
                },
              },
            },
          },
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreatePet' },
                },
              },
            },
            responses: { '201': { description: 'Created' } },
          },
        },
        '/pets/{petId}': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Pet' },
                  },
                },
              },
            },
          },
          delete: {
            deprecated: true,
            description: 'Use archive instead',
            responses: { '204': { description: 'Deleted' } },
          },
        },
      },
      components: {
        schemas: {
          Pet: {
            allOf: [
              { $ref: '#/components/schemas/CreatePet' },
              { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
            ],
          },
          CreatePet: {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
        },
      },
    } as const satisfies OpenApiDocument

    type Api = OpenApiToRestApi<typeof typedDoc>

    it('Should produce a valid RestApi type', () => {
      expectTypeOf<Api>().toMatchTypeOf<RestApi>()
    })

    it('Should have GET and POST on /pets, GET and DELETE on /pets/:petId', () => {
      expectTypeOf<Api['GET']>().toHaveProperty('/pets')
      expectTypeOf<Api['POST']>().toHaveProperty('/pets')
      expectTypeOf<Api['GET']>().toHaveProperty('/pets/:petId')
      expectTypeOf<Api['DELETE']>().toHaveProperty('/pets/:petId')
    })

    it('Should resolve $ref in GET /pets/:petId response via allOf', () => {
      type Result = Api['GET']['/pets/:petId']['result']
      expectTypeOf<Result>().toHaveProperty('id')
      expectTypeOf<Result>().toHaveProperty('name')
    })

    it('Should resolve $ref in POST /pets request body', () => {
      type Body = Api['POST']['/pets']['body']
      expectTypeOf<Body>().toHaveProperty('name')
    })

    it('Should extract path params from /pets/{petId}', () => {
      type Url = Api['GET']['/pets/:petId']['url']
      expectTypeOf<Url>().toHaveProperty('petId')
    })

    it('Should extract tags metadata', () => {
      type ListPets = Api['GET']['/pets']
      expectTypeOf<ListPets>().toHaveProperty('tags')
      expectTypeOf<ListPets>().toHaveProperty('summary')
      expectTypeOf<ListPets>().toHaveProperty('description')
    })

    it('Should extract deprecated flag', () => {
      type DeletePet = Api['DELETE']['/pets/:petId']
      expectTypeOf<DeletePet>().toHaveProperty('deprecated')
      expectTypeOf<DeletePet>().toHaveProperty('description')
    })
  })
})
