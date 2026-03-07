import { describe, expect, it } from 'vitest'
import type { OpenApiDocument } from './openapi-document.js'
import { resolveOpenApiRefs } from './openapi-resolve-refs.js'

describe('resolveOpenApiRefs', () => {
  describe('Schema $ref resolution', () => {
    it('Should resolve $ref to components/schemas', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            User: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const { schema } = (
        resolved.paths?.['/users']?.get?.responses?.['200'] as { content: Record<string, { schema: unknown }> }
      ).content['application/json']
      expect(schema).toEqual({ type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } })
    })

    it('Should resolve nested $ref chains', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          category: { $ref: '#/components/schemas/Category' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            Category: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const schema = (
        resolved.paths?.['/items']?.get?.responses?.['200'] as { content: Record<string, { schema: unknown }> }
      ).content['application/json'].schema as Record<string, unknown>
      const props = (schema.properties as Record<string, unknown>).category as Record<string, unknown>
      expect(props.type).toBe('object')
      expect(props.properties).toEqual({ id: { type: 'integer' }, name: { type: 'string' } })
    })
  })

  describe('Parameter $ref resolution', () => {
    it('Should resolve $ref parameters', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              parameters: [{ $ref: '#/components/parameters/LimitParam' }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        components: {
          parameters: {
            LimitParam: { name: 'limit', in: 'query', schema: { type: 'integer' } },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const params = resolved.paths?.['/items']?.get?.parameters as Array<Record<string, unknown>>
      expect(params[0].name).toBe('limit')
      expect(params[0].in).toBe('query')
    })
  })

  describe('Response $ref resolution', () => {
    it('Should resolve $ref responses', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: {
                '400': { $ref: '#/components/responses/BadRequest' },
              },
            },
          },
        },
        components: {
          responses: {
            BadRequest: {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { message: { type: 'string' } } },
                },
              },
            },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const resp = resolved.paths?.['/items']?.get?.responses?.['400'] as Record<string, unknown>
      expect(resp.description).toBe('Bad request')
    })
  })

  describe('RequestBody $ref resolution', () => {
    it('Should resolve $ref in requestBody schema', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Item' },
                  },
                },
              },
              responses: { '201': { description: 'Created' } },
            },
          },
        },
        components: {
          schemas: {
            Item: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const body = resolved.paths?.['/items']?.post?.requestBody as Record<string, unknown>
      const schema = ((body.content as Record<string, unknown>)['application/json'] as Record<string, unknown>)
        .schema as Record<string, unknown>
      expect(schema.type).toBe('object')
    })
  })

  describe('Edge cases', () => {
    it('Should handle circular $ref by breaking the cycle with empty object', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        components: {
          schemas: {
            Node: {
              type: 'object',
              properties: {
                value: { type: 'string' },
                child: { $ref: '#/components/schemas/Node' },
              },
            },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const nodeSchema = resolved.components?.schemas?.Node as Record<string, unknown>
      expect(nodeSchema.type).toBe('object')
      const props = nodeSchema.properties as Record<string, Record<string, unknown>>
      expect(props.value).toEqual({ type: 'string' })
      // The circular child ref is resolved, but the nested self-ref within it breaks the cycle
      expect(props.child.type).toBe('object')
      const childProps = props.child.properties as Record<string, Record<string, unknown>>
      expect(childProps.value).toEqual({ type: 'string' })
      expect(childProps.child).toEqual({})
    })

    it('Should not modify the original document', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } },
                },
              },
            },
          },
        },
        components: { schemas: { Item: { type: 'object' } } },
      }

      resolveOpenApiRefs(doc)
      const schema = doc.paths?.['/items']?.get?.responses?.['200'] as Record<string, unknown>
      expect((schema.content as Record<string, { schema: unknown }>)['application/json'].schema).toEqual({
        $ref: '#/components/schemas/Item',
      })
    })

    it('Should leave external $ref as-is', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/json': { schema: { $ref: 'external.json#/Schema' } } },
                },
              },
            },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const { schema } = (
        resolved.paths?.['/items']?.get?.responses?.['200'] as { content: Record<string, { schema: unknown }> }
      ).content['application/json']
      expect(schema).toEqual({ $ref: 'external.json#/Schema' })
    })

    it('Should leave unresolvable $ref as-is', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/json': { schema: { $ref: '#/components/schemas/Missing' } } },
                },
              },
            },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const { schema } = (
        resolved.paths?.['/items']?.get?.responses?.['200'] as { content: Record<string, { schema: unknown }> }
      ).content['application/json']
      expect(schema).toEqual({ $ref: '#/components/schemas/Missing' })
    })

    it('Should handle documents with no $ref', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/health': { get: { responses: { '200': { description: 'OK' } } } },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      expect(resolved.paths?.['/health']?.get?.responses?.['200']).toEqual({ description: 'OK' })
    })

    it('Should resolve arrays of items with $ref', () => {
      const doc: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              parameters: [{ $ref: '#/components/parameters/A' }, { $ref: '#/components/parameters/B' }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        components: {
          parameters: {
            A: { name: 'a', in: 'query', schema: { type: 'string' } },
            B: { name: 'b', in: 'query', schema: { type: 'integer' } },
          },
        },
      }

      const resolved = resolveOpenApiRefs(doc)
      const params = resolved.paths?.['/items']?.get?.parameters as Array<Record<string, unknown>>
      expect(params).toHaveLength(2)
      expect(params[0].name).toBe('a')
      expect(params[1].name).toBe('b')
    })
  })
})
