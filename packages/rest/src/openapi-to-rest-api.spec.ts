import { describe, it, expectTypeOf } from 'vitest'
import type { OpenApiDocument } from './openapi-document.js'
import type { ConvertOpenApiPath, JsonSchemaToType, OpenApiToRestApi } from './openapi-to-rest-api.js'
import type { RestApi } from './rest-api.js'

describe('ConvertOpenApiPath', () => {
  it('Should convert single {param} to :param', () => {
    expectTypeOf<ConvertOpenApiPath<'/users/{id}'>>().toEqualTypeOf<'/users/:id'>()
  })

  it('Should convert multiple params', () => {
    expectTypeOf<ConvertOpenApiPath<'/users/{userId}/posts/{postId}'>>().toEqualTypeOf<'/users/:userId/posts/:postId'>()
  })

  it('Should pass through paths without params', () => {
    expectTypeOf<ConvertOpenApiPath<'/users'>>().toEqualTypeOf<'/users'>()
  })

  it('Should handle root path', () => {
    expectTypeOf<ConvertOpenApiPath<'/'>>().toEqualTypeOf<'/'>()
  })

  it('Should handle param at the end', () => {
    expectTypeOf<ConvertOpenApiPath<'/{version}'>>().toEqualTypeOf<'/:version'>()
  })

  it('Should handle adjacent segments with params', () => {
    expectTypeOf<ConvertOpenApiPath<'/{a}/{b}'>>().toEqualTypeOf<'/:a/:b'>()
  })
})

describe('JsonSchemaToType', () => {
  describe('Primitive types', () => {
    it('Should map string', () => {
      expectTypeOf<JsonSchemaToType<{ type: 'string' }>>().toEqualTypeOf<string>()
    })

    it('Should map number', () => {
      expectTypeOf<JsonSchemaToType<{ type: 'number' }>>().toEqualTypeOf<number>()
    })

    it('Should map integer to number', () => {
      expectTypeOf<JsonSchemaToType<{ type: 'integer' }>>().toEqualTypeOf<number>()
    })

    it('Should map boolean', () => {
      expectTypeOf<JsonSchemaToType<{ type: 'boolean' }>>().toEqualTypeOf<boolean>()
    })

    it('Should map null', () => {
      expectTypeOf<JsonSchemaToType<{ type: 'null' }>>().toEqualTypeOf<null>()
    })
  })

  describe('String enums', () => {
    it('Should map string enum to union', () => {
      type Schema = { type: 'string'; enum: readonly ['a', 'b', 'c'] }
      expectTypeOf<JsonSchemaToType<Schema>>().toEqualTypeOf<'a' | 'b' | 'c'>()
    })

    it('Should map single-value enum', () => {
      type Schema = { type: 'string'; enum: readonly ['only'] }
      expectTypeOf<JsonSchemaToType<Schema>>().toEqualTypeOf<'only'>()
    })
  })

  describe('Arrays', () => {
    it('Should map string array', () => {
      expectTypeOf<JsonSchemaToType<{ type: 'array'; items: { type: 'string' } }>>().toEqualTypeOf<string[]>()
    })

    it('Should map number array', () => {
      expectTypeOf<JsonSchemaToType<{ type: 'array'; items: { type: 'number' } }>>().toEqualTypeOf<number[]>()
    })

    it('Should map nested object array', () => {
      type Schema = { type: 'array'; items: { type: 'object'; properties: { id: { type: 'string' } } } }
      expectTypeOf<JsonSchemaToType<Schema>>().toEqualTypeOf<Array<{ id?: string }>>()
    })
  })

  describe('Objects', () => {
    it('Should map object with all-optional properties', () => {
      type Schema = { type: 'object'; properties: { name: { type: 'string' }; age: { type: 'number' } } }
      expectTypeOf<JsonSchemaToType<Schema>>().toEqualTypeOf<{ name?: string; age?: number }>()
    })

    it('Should map object with required properties', () => {
      type Schema = {
        type: 'object'
        properties: { name: { type: 'string' }; age: { type: 'number' } }
        required: readonly ['name']
      }
      expectTypeOf<JsonSchemaToType<Schema>>().toEqualTypeOf<{ name: string } & { age?: number }>()
    })

    it('Should map object with all required properties', () => {
      type Schema = {
        type: 'object'
        properties: { name: { type: 'string' }; age: { type: 'number' } }
        required: readonly ['name', 'age']
      }
      type Result = JsonSchemaToType<Schema>
      expectTypeOf<Result>().toHaveProperty('name')
      expectTypeOf<Result['name']>().toEqualTypeOf<string>()
      expectTypeOf<Result['age']>().toEqualTypeOf<number>()
    })

    it('Should map object without properties to Record<string, unknown>', () => {
      expectTypeOf<JsonSchemaToType<{ type: 'object' }>>().toEqualTypeOf<Record<string, unknown>>()
    })
  })

  describe('Fallback', () => {
    it('Should return unknown for unrecognized schemas', () => {
      expectTypeOf<JsonSchemaToType<{ description: 'something' }>>().toEqualTypeOf<unknown>()
    })

    it('Should return unknown for empty object', () => {
      expectTypeOf<JsonSchemaToType<Record<string, never>>>().toEqualTypeOf<unknown>()
    })
  })
})

describe('OpenApiToRestApi', () => {
  describe('HTTP methods', () => {
    it('Should extract GET endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': { get: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toMatchTypeOf<RestApi>()
      expectTypeOf<Api>().toHaveProperty('GET')
    })

    it('Should extract POST endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': { post: { responses: { '201': { description: 'Created' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toHaveProperty('POST')
    })

    it('Should extract PUT endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items/{id}': { put: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toHaveProperty('PUT')
    })

    it('Should extract DELETE endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items/{id}': { delete: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toHaveProperty('DELETE')
    })

    it('Should extract PATCH endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items/{id}': { patch: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toHaveProperty('PATCH')
    })

    it('Should extract HEAD endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': { head: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toHaveProperty('HEAD')
    })

    it('Should extract OPTIONS endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': { options: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toHaveProperty('OPTIONS')
    })

    it('Should extract TRACE endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': { trace: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toHaveProperty('TRACE')
    })

    it('Should handle multiple methods on the same path', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: { responses: { '200': { description: 'OK' } } },
            post: { responses: { '201': { description: 'Created' } } },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toHaveProperty('GET')
      expectTypeOf<Api>().toHaveProperty('POST')
    })

    it('Should only include methods that have endpoints', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': { get: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().not.toHaveProperty('POST')
      expectTypeOf<Api>().not.toHaveProperty('PUT')
      expectTypeOf<Api>().not.toHaveProperty('DELETE')
      expectTypeOf<Api>().not.toHaveProperty('PATCH')
    })
  })

  describe('Response types', () => {
    it('Should extract typed 200 response', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
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
      expectTypeOf<Api['GET']['/users']['result']>().toMatchTypeOf<string[]>()
    })

    it('Should extract typed 201 response', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            post: {
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
      expectTypeOf<Api['POST']['/users']['result']>().toEqualTypeOf<{ readonly id?: string }>()
    })

    it('Should return unknown for responses without schemas', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/health': { get: { responses: { '200': { description: 'OK' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api['GET']['/health']['result']>().toEqualTypeOf<unknown>()
    })

    it('Should return unknown for non-JSON content types', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/file': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/octet-stream': { schema: { type: 'string' } } },
                },
              },
            },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api['GET']['/file']['result']>().toEqualTypeOf<unknown>()
    })
  })

  describe('Path parameters', () => {
    it('Should extract single path parameter', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{id}': {
            get: { responses: { '200': { description: 'OK' } } },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      type Url = Api['GET']['/users/:id']['url']
      expectTypeOf<Url>().toHaveProperty('id')
      expectTypeOf<Url['id']>().toBeString()
    })

    it('Should extract multiple path parameters', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{userId}/posts/{postId}': {
            get: { responses: { '200': { description: 'OK' } } },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      type Url = Api['GET']['/users/:userId/posts/:postId']['url']
      expectTypeOf<Url>().toHaveProperty('userId')
      expectTypeOf<Url>().toHaveProperty('postId')
      expectTypeOf<Url['userId']>().toBeString()
      expectTypeOf<Url['postId']>().toBeString()
    })

    it('Should not have url property for paths without params', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: { responses: { '200': { description: 'OK' } } },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      type Endpoint = Api['GET']['/users']
      expectTypeOf<Endpoint>().not.toHaveProperty('url')
    })
  })

  describe('Request body', () => {
    it('Should extract JSON request body', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { name: { type: 'string' }, email: { type: 'string' } },
                      required: ['name', 'email'] as const,
                    },
                  },
                },
              },
              responses: { '201': { description: 'Created' } },
            },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api['POST']['/users']['body']>().toMatchTypeOf<{
        name: string
        email: string
      }>()
    })

    it('Should not have body property when no request body', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: { responses: { '200': { description: 'OK' } } },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      type Endpoint = Api['GET']['/items']
      expectTypeOf<Endpoint>().not.toHaveProperty('body')
    })
  })

  describe('Query parameters', () => {
    it('Should extract typed query parameters', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/search': {
            get: {
              parameters: [
                { name: 'q', in: 'query', schema: { type: 'string' } },
                { name: 'limit', in: 'query', schema: { type: 'integer' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api['GET']['/search']['query']>().toEqualTypeOf<{ q: string } & { limit: number }>()
    })

    it('Should default to string for query params without schema', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/search': {
            get: {
              parameters: [{ name: 'q', in: 'query' }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api['GET']['/search']['query']>().toEqualTypeOf<{ q: string }>()
    })

    it('Should not mix path params into query', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{id}': {
            get: {
              parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                { name: 'fields', in: 'query', schema: { type: 'string' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      type Query = Api['GET']['/users/:id']['query']
      expectTypeOf<Query>().toHaveProperty('fields')
      expectTypeOf<Query['fields']>().toBeString()
      type Url = Api['GET']['/users/:id']['url']
      expectTypeOf<Url>().toHaveProperty('id')
      expectTypeOf<Url['id']>().toBeString()
    })

    it('Should not have query property when no query parameters', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      type Endpoint = Api['GET']['/items']
      expectTypeOf<Endpoint>().not.toHaveProperty('query')
    })
  })

  describe('Edge cases', () => {
    it('Should handle document with no paths', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toMatchTypeOf<RestApi>()
    })

    it('Should handle document with empty paths', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api>().toMatchTypeOf<RestApi>()
    })

    it('Should handle multiple paths', () => {
      const doc = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/a': { get: { responses: { '200': { description: 'OK' } } } },
          '/b': { get: { responses: { '200': { description: 'OK' } } } },
          '/c': { post: { responses: { '201': { description: 'Created' } } } },
        },
      } as const satisfies OpenApiDocument

      type Api = OpenApiToRestApi<typeof doc>
      expectTypeOf<Api['GET']>().toHaveProperty('/a')
      expectTypeOf<Api['GET']>().toHaveProperty('/b')
      expectTypeOf<Api['POST']>().toHaveProperty('/c')
    })
  })
})
