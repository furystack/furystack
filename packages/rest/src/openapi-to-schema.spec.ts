import { describe, expect, it } from 'vitest'
import type { OpenApiDocument } from './openapi-document.js'
import { convertOpenApiPathToFuryStack, openApiToSchema } from './openapi-to-schema.js'

describe('convertOpenApiPathToFuryStack', () => {
  it('Should convert single {param} to :param', () => {
    expect(convertOpenApiPathToFuryStack('/users/{id}')).toBe('/users/:id')
  })

  it('Should convert multiple params', () => {
    expect(convertOpenApiPathToFuryStack('/users/{userId}/posts/{postId}')).toBe('/users/:userId/posts/:postId')
  })

  it('Should pass through paths without params', () => {
    expect(convertOpenApiPathToFuryStack('/users')).toBe('/users')
  })

  it('Should handle root path', () => {
    expect(convertOpenApiPathToFuryStack('/')).toBe('/')
  })

  it('Should handle param at the start', () => {
    expect(convertOpenApiPathToFuryStack('/{version}')).toBe('/:version')
  })
})

describe('openApiToSchema', () => {
  describe('Document info', () => {
    it('Should extract title, version, and description', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'My API', version: '2.0.0', description: 'A test API' },
      }

      const schema = openApiToSchema(doc)
      expect(schema.name).toBe('My API')
      expect(schema.version).toBe('2.0.0')
      expect(schema.description).toBe('A test API')
    })

    it('Should default description to empty string when absent', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      }

      const schema = openApiToSchema(doc)
      expect(schema.description).toBe('')
    })
  })

  describe('HTTP methods', () => {
    it('Should extract GET endpoints', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/items': { get: { responses: { '200': { description: 'OK' } } } } },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET).toBeDefined()
      expect(schema.endpoints.GET!['/items']).toBeDefined()
    })

    it('Should extract POST endpoints', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/items': { post: { responses: { '201': { description: 'Created' } } } } },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.POST).toBeDefined()
      expect(schema.endpoints.POST!['/items']).toBeDefined()
    })

    it('Should extract PUT endpoints', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/items/{id}': { put: { responses: { '200': { description: 'OK' } } } } },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.PUT).toBeDefined()
      expect(schema.endpoints.PUT!['/items/:id']).toBeDefined()
    })

    it('Should extract DELETE endpoints', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/items/{id}': { delete: { responses: { '200': { description: 'OK' } } } } },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.DELETE).toBeDefined()
      expect(schema.endpoints.DELETE!['/items/:id']).toBeDefined()
    })

    it('Should extract PATCH endpoints', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/items/{id}': { patch: { responses: { '200': { description: 'OK' } } } } },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.PATCH).toBeDefined()
      expect(schema.endpoints.PATCH!['/items/:id']).toBeDefined()
    })

    it('Should extract HEAD endpoints', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/items': { head: { responses: { '200': { description: 'OK' } } } } },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.HEAD).toBeDefined()
      expect(schema.endpoints.HEAD!['/items']).toBeDefined()
    })

    it('Should extract OPTIONS endpoints', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/items': { options: { responses: { '200': { description: 'OK' } } } } },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.OPTIONS).toBeDefined()
      expect(schema.endpoints.OPTIONS!['/items']).toBeDefined()
    })

    it('Should extract TRACE endpoints', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/items': { trace: { responses: { '200': { description: 'OK' } } } } },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.TRACE).toBeDefined()
      expect(schema.endpoints.TRACE!['/items']).toBeDefined()
    })

    it('Should handle multiple HTTP methods on the same path', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: { responses: { '200': { description: 'OK' } } },
            post: { responses: { '201': { description: 'Created' } } },
            delete: { responses: { '200': { description: 'Deleted' } } },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/items']).toBeDefined()
      expect(schema.endpoints.POST!['/items']).toBeDefined()
      expect(schema.endpoints.DELETE!['/items']).toBeDefined()
    })
  })

  describe('Path parameters', () => {
    it('Should convert single {param} to :param', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{id}': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/users/:id']).toBeDefined()
      expect(schema.endpoints.GET!['/users/:id'].path).toBe('/users/:id')
    })

    it('Should convert multiple {params} to :params', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{userId}/posts/{postId}': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/users/:userId/posts/:postId']).toBeDefined()
      expect(schema.endpoints.GET!['/users/:userId/posts/:postId'].path).toBe('/users/:userId/posts/:postId')
    })
  })

  describe('Response schema extraction', () => {
    it('Should extract schema from 200 response', () => {
      const responseSchema = { type: 'object', properties: { id: { type: 'string' } } }
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: {
                '200': { description: 'OK', content: { 'application/json': { schema: responseSchema } } },
              },
            },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/items'].schema).toEqual(responseSchema)
    })

    it('Should fall back to 201 response schema', () => {
      const responseSchema = { type: 'object', properties: { id: { type: 'string' } } }
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            post: {
              responses: {
                '201': { description: 'Created', content: { 'application/json': { schema: responseSchema } } },
              },
            },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.POST!['/items'].schema).toEqual(responseSchema)
    })

    it('Should return empty object for responses without content', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/health': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/health'].schema).toEqual({})
    })

    it('Should skip $ref response objects', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: {
                '200': { $ref: '#/components/responses/Success' },
              },
            },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/items'].schema).toEqual({})
    })
  })

  describe('Schema naming', () => {
    it('Should use operationId as schemaName when available', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': { get: { operationId: 'listUsers', responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/users'].schemaName).toBe('listUsers')
    })

    it('Should generate schemaName from method and path when no operationId', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{id}': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/users/:id'].schemaName).toBe('get_users_id')
    })
  })

  describe('Authentication detection', () => {
    it('Should mark as not authenticated when no security defined', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/public': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/public'].isAuthenticated).toBe(false)
    })

    it('Should mark as not authenticated with empty operation security', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/public': { get: { security: [], responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/public'].isAuthenticated).toBe(false)
    })

    it('Should mark as authenticated from operation-level security', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/private': {
            get: { security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/private'].isAuthenticated).toBe(true)
    })

    it('Should mark as authenticated from document-level security', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        security: [{ apiKey: [] }],
        paths: {
          '/items': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/items'].isAuthenticated).toBe(true)
    })

    it('Should prefer operation-level security over document-level', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        security: [{ apiKey: [] }],
        paths: {
          '/public': {
            get: { security: [], responses: { '200': { description: 'OK' } } },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/public'].isAuthenticated).toBe(false)
    })
  })

  describe('Security scheme name extraction', () => {
    it('Should extract operation-level security scheme names', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/private': {
            get: { security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/private'].securitySchemes).toEqual(['bearerAuth'])
    })

    it('Should extract multiple security scheme names', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/private': {
            get: {
              security: [{ bearerAuth: [] }, { apiKey: [] }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/private'].securitySchemes).toEqual(['bearerAuth', 'apiKey'])
    })

    it('Should inherit document-level security scheme names', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        security: [{ apiKey: [] }],
        paths: {
          '/items': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/items'].securitySchemes).toEqual(['apiKey'])
    })

    it('Should not set securitySchemes when security is empty', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/public': { get: { security: [], responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/public'].securitySchemes).toBeUndefined()
    })

    it('Should not set securitySchemes when no security defined', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/public': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/public'].securitySchemes).toBeUndefined()
    })

    it('Should prefer operation-level scheme names over document-level', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        security: [{ apiKey: [] }],
        paths: {
          '/custom': {
            get: { security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/custom'].securitySchemes).toEqual(['bearerAuth'])
    })
  })

  describe('Edge cases', () => {
    it('Should handle documents with no paths', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Empty', version: '0.0.1' },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints).toEqual({})
    })

    it('Should skip $ref path items', () => {
      const paths = {
        '/ref-path': { $ref: '#/components/pathItems/SomePath' },
        '/real-path': { get: { responses: { '200': { description: 'OK' } } } },
      } as Record<string, unknown>
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: paths as OpenApiDocument['paths'],
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/real-path']).toBeDefined()
      expect(schema.endpoints.GET!['/ref-path']).toBeUndefined()
    })

    it('Should handle path items with summary/description but no operations', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/no-ops': { summary: 'A path with no operations' },
        },
      }

      const schema = openApiToSchema(doc)
      expect(Object.keys(schema.endpoints)).toEqual([])
    })
  })

  describe('Document-level metadata extraction', () => {
    it('Should extract all info metadata fields', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: {
          title: 'Test',
          version: '1.0.0',
          summary: 'A test API',
          termsOfService: 'https://example.com/terms',
          contact: { name: 'Support', email: 'support@example.com' },
          license: { name: 'MIT' },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.metadata?.summary).toBe('A test API')
      expect(schema.metadata?.termsOfService).toBe('https://example.com/terms')
      expect(schema.metadata?.contact).toEqual({ name: 'Support', email: 'support@example.com' })
      expect(schema.metadata?.license).toEqual({ name: 'MIT' })
    })

    it('Should extract servers with variables', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        servers: [
          {
            url: 'https://{env}.example.com',
            variables: { env: { default: 'prod', enum: ['prod', 'staging'] } },
          },
        ],
      }

      const schema = openApiToSchema(doc)
      expect(schema.metadata?.servers).toHaveLength(1)
      expect(schema.metadata?.servers?.[0].url).toBe('https://{env}.example.com')
      expect(schema.metadata?.servers?.[0].variables?.env.default).toBe('prod')
    })

    it('Should extract tags', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        tags: [
          { name: 'pets', description: 'Pet operations' },
          { name: 'store', externalDocs: { url: 'https://example.com/docs' } },
        ],
      }

      const schema = openApiToSchema(doc)
      expect(schema.metadata?.tags).toHaveLength(2)
      expect(schema.metadata?.tags?.[0].name).toBe('pets')
    })

    it('Should extract externalDocs', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        externalDocs: { url: 'https://example.com/docs', description: 'Full docs' },
      }

      const schema = openApiToSchema(doc)
      expect(schema.metadata?.externalDocs).toEqual({ url: 'https://example.com/docs', description: 'Full docs' })
    })

    it('Should extract security schemes', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.metadata?.securitySchemes?.bearerAuth).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })
      expect(schema.metadata?.securitySchemes?.apiKey).toBeDefined()
    })

    it('Should skip $ref security schemes', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        components: {
          securitySchemes: {
            external: { $ref: '#/components/securitySchemes/Other' } as unknown as OpenApiDocument extends never
              ? never
              : { $ref: string; type: 'apiKey'; in: 'header'; name: 'x' },
            local: { type: 'apiKey', in: 'header', name: 'X-Key' },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.metadata?.securitySchemes?.local).toBeDefined()
      expect(schema.metadata?.securitySchemes?.external).toBeUndefined()
    })

    it('Should not set securitySchemes when all are $ref', () => {
      const schemes = {
        external: { $ref: '#/other' },
      } as Record<string, unknown>
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        components: {
          securitySchemes: schemes as OpenApiDocument['components'] extends { securitySchemes?: infer S } ? S : never,
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.metadata?.securitySchemes).toBeUndefined()
    })

    it('Should return undefined metadata when no metadata present', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      }

      const schema = openApiToSchema(doc)
      expect(schema.metadata).toBeUndefined()
    })
  })

  describe('Operation-level metadata extraction', () => {
    it('Should extract tags from operations', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/pets': {
            get: { tags: ['pets'], responses: { '200': { description: 'OK' } } },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/pets'].tags).toEqual(['pets'])
    })

    it('Should extract deprecated flag from operations', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/old': {
            get: { deprecated: true, responses: { '200': { description: 'OK' } } },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/old'].deprecated).toBe(true)
    })

    it('Should extract summary and description from operations', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/pets': {
            get: {
              summary: 'List pets',
              description: 'Returns all pets',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/pets'].summary).toBe('List pets')
      expect(schema.endpoints.GET!['/pets'].description).toBe('Returns all pets')
    })

    it('Should not set metadata fields when absent', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: { responses: { '200': { description: 'OK' } } },
          },
        },
      }

      const schema = openApiToSchema(doc)
      expect(schema.endpoints.GET!['/items'].tags).toBeUndefined()
      expect(schema.endpoints.GET!['/items'].deprecated).toBeUndefined()
      expect(schema.endpoints.GET!['/items'].summary).toBeUndefined()
      expect(schema.endpoints.GET!['/items'].description).toBeUndefined()
    })
  })
})
