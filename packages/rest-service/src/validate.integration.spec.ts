import { getStoreManager, InMemoryStore, User } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import type { SwaggerDocument, WithSchemaAction } from '@furystack/rest'
import { createClient, ResponseError } from '@furystack/rest-client-fetch'
import { usingAsync } from '@furystack/utils'
import type Ajv from 'ajv'
import { describe, expect, it } from 'vitest'
import { useRestService } from './helpers.js'
import { DefaultSession } from './models/default-session.js'
import { JsonResult } from './request-action-implementation.js'
import type { ValidationApi } from './validate.integration.schema.js'
import schema from './validate.integration.spec.schema.json' with { type: 'json' }
import { Validate } from './validate.js'

// To recreate: yarn ts-json-schema-generator -f tsconfig.json --no-type-check -p packages/rest-service/src/validate.integration.schema.ts -o packages/rest-service/src/validate.integration.spec.schema.json

const createValidateApi = async (options = { enableGetSchema: false }) => {
  const injector = new Injector()
  const port = getPort()

  getStoreManager(injector).addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
  getStoreManager(injector).addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))

  const api = await useRestService<ValidationApi>({
    injector,
    enableGetSchema: options.enableGetSchema,
    api: {
      GET: {
        '/validate-query': Validate({
          schema,
          schemaName: 'ValidateQuery',
        })(async ({ getQuery }) => JsonResult({ ...getQuery() })),
        '/validate-url/:id': Validate({
          schema,
          schemaName: 'ValidateUrl',
        })(async ({ getUrlParams }) => JsonResult({ ...getUrlParams() })),
        '/validate-headers': Validate({
          schema,
          schemaName: 'ValidateHeaders',
        })(async ({ headers }) => JsonResult({ ...headers })),
        '/mock': undefined as any, // ToDo: Generator and test
        '/mock/:id': undefined as any, // ToDo: Generator and test
      },
      POST: {
        '/validate-body': Validate({
          schema,
          schemaName: 'ValidateBody',
        })(async ({ getBody }) => {
          const body = await getBody()
          return JsonResult({ ...body })
        }),
        '/mock': undefined as any, // ToDo: Generator and test
      },
      PATCH: {
        '/mock/:id': undefined as any, // ToDo: Generator and test
      },
      DELETE: {
        '/mock/:id': undefined as any, // ToDo: Generator and test
      },
    },
    port,
    root: '/api',
  })
  const client = createClient<ValidationApi>({
    endpointUrl: `http://127.0.0.1:${port}/api`,
  })

  return {
    [Symbol.asyncDispose]: injector[Symbol.asyncDispose].bind(injector),
    injector,
    api,
    client,
  }
}

describe('Validation integration tests', () => {
  describe('swagger.json schema definition', () => {
    it('Should return a 404 when not enabled', async () => {
      await usingAsync(await createValidateApi({ enableGetSchema: false }), async ({ client }) => {
        try {
          await (client as ReturnType<typeof createClient<any>>)({
            method: 'GET',
            action: '/swagger.json',
          })
          expect.fail('Expected response error but got success')
        } catch (error) {
          expect(error).toBeInstanceOf(ResponseError)
          expect((error as ResponseError).response.status).toBe(404)
        }
      })
    })

    it('Should return a generated swagger.json when enabled', async () => {
      await usingAsync(await createValidateApi({ enableGetSchema: true }), async ({ client }) => {
        const result = await (client as ReturnType<typeof createClient<any>>)({
          method: 'GET',
          action: '/swagger.json',
        })

        expect(result.response.status).toBe(200)
        expect(result.result).toBeDefined()

        // Verify swagger document structure
        const swaggerJson = result.result as SwaggerDocument
        expect(swaggerJson.openapi).toBe('3.1.0')
        expect(swaggerJson.info).toBeDefined()
        expect(swaggerJson.info?.title).toBe('FuryStack API')
        expect(swaggerJson.paths).toBeDefined()

        // Verify our API endpoints are included
        expect(swaggerJson.paths?.['/validate-query']).toBeDefined()
        expect(swaggerJson.paths?.['/validate-url/{id}']).toBeDefined()
        expect(swaggerJson.paths?.['/validate-headers']).toBeDefined()
        expect(swaggerJson.paths?.['/validate-body']).toBeDefined()

        // Verify components section
        expect(swaggerJson.components).toBeDefined()
        expect(swaggerJson.components?.schemas).toBeDefined()
        expect(swaggerJson.components?.schemas?.ValidateQuery).toBeDefined()
        expect(swaggerJson.components?.schemas?.ValidateUrl).toBeDefined()
        expect(swaggerJson.components?.schemas?.ValidateHeaders).toBeDefined()
        expect(swaggerJson.components?.schemas?.ValidateBody).toBeDefined()
      })
    })
  })

  describe('Validation metadata', () => {
    it('Should return 404 when not enabled', async () => {
      await usingAsync(await createValidateApi({ enableGetSchema: false }), async ({ client }) => {
        try {
          await (client as ReturnType<typeof createClient<WithSchemaAction<ValidationApi>>>)({
            method: 'GET',
            action: '/schema',
            headers: {
              accept: 'application/schema+json',
            },
          })
        } catch (error) {
          expect(error).toBeInstanceOf(ResponseError)
          expect((error as ResponseError).response.status).toBe(404)
        }
      })
    })

    it('Should return a 406 when the accept header is not supported', async () => {
      expect.assertions(2)
      await usingAsync(await createValidateApi({ enableGetSchema: true }), async ({ client }) => {
        try {
          await (client as ReturnType<typeof createClient<WithSchemaAction<ValidationApi>>>)({
            method: 'GET',
            action: '/schema',
            headers: {
              accept: 'text/plain' as any,
            },
          })
        } catch (error) {
          expect(error).toBeInstanceOf(ResponseError)
          expect((error as ResponseError).response.status).toBe(406)
        }
      })
    })

    it('Should return the validation metadata', async () => {
      await usingAsync(await createValidateApi({ enableGetSchema: true }), async ({ client }) => {
        const result = await (client as ReturnType<typeof createClient<WithSchemaAction<ValidationApi>>>)({
          method: 'GET',
          action: '/schema',
          headers: {
            accept: 'application/schema+json',
          },
        })

        expect(result.response.status).toBe(200)
        expect(result.result).toBeDefined()

        expect(result.result['/validate-query']).toBeDefined()

        expect(result.result['/validate-query'].schema).toStrictEqual(schema)
        expect(result.result['/validate-query'].schemaName).toBe('ValidateQuery')
        expect(result.result['/validate-query'].method).toBe('GET')
        expect(result.result['/validate-query'].path).toBe('/validate-query')
        expect(result.result['/validate-query'].isAuthenticated).toBe(false)

        expect(result.result['/validate-url/:id']).toBeDefined()
        expect(result.result['/validate-url/:id'].schema).toStrictEqual(schema)
        expect(result.result['/validate-url/:id'].schemaName).toBe('ValidateUrl')
        expect(result.result['/validate-url/:id'].method).toBe('GET')
        expect(result.result['/validate-url/:id'].path).toBe('/validate-url/:id')
        expect(result.result['/validate-url/:id'].isAuthenticated).toBe(false)

        expect(result.result['/validate-headers']).toBeDefined()
        expect(result.result['/validate-headers'].schema).toStrictEqual(schema)
        expect(result.result['/validate-headers'].schemaName).toBe('ValidateHeaders')
        expect(result.result['/validate-headers'].method).toBe('GET')
        expect(result.result['/validate-headers'].path).toBe('/validate-headers')
        expect(result.result['/validate-headers'].isAuthenticated).toBe(false)

        expect(result.result['/validate-body']).toBeDefined()
        expect(result.result['/validate-body'].schema).toStrictEqual(schema)
        expect(result.result['/validate-body'].schemaName).toBe('ValidateBody')
        expect(result.result['/validate-body'].method).toBe('POST')
        expect(result.result['/validate-body'].path).toBe('/validate-body')
        expect(result.result['/validate-body'].isAuthenticated).toBe(false)

        expect(result.result['/mock']).toBeUndefined()
        expect(result.result['/mock/:id']).toBeUndefined()
      })
    })
  })

  describe('Validation errors', () => {
    it('Should validate query', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        expect.assertions(5)
        try {
          await client({
            method: 'GET',
            action: '/validate-query',
            query: undefined as any,
          })
        } catch (error) {
          if (error instanceof ResponseError) {
            expect(error.message).toBe('Bad Request')
            expect(error.response?.status).toBe(400)
            const responseJson: { errors: Ajv.ErrorObject[] } = await error.response.json()
            expect(responseJson.errors[0].params.missingProperty).toEqual('foo')
            expect(responseJson.errors[1].params.missingProperty).toEqual('bar')
            expect(responseJson.errors[2].params.missingProperty).toEqual('baz')
          }
        }
      })
    })
    it('Should validate url', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        expect.assertions(4)
        try {
          await client({
            method: 'GET',
            action: '/validate-url/:id',
            url: undefined as any,
          })
        } catch (error) {
          if (error instanceof ResponseError) {
            expect(error.message).toBe('Bad Request')
            expect(error.response?.status).toBe(400)
            const responseJson: { errors: Ajv.ErrorObject[] } = await error.response.json()
            expect(responseJson.errors[0].params.type).toEqual('number')
            expect(responseJson.errors[0].instancePath).toEqual('/url/id')
          }
        }
      })
    })
    it('Should validate headers', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        expect.assertions(3)
        try {
          await client({
            method: 'GET',
            action: '/validate-headers',
            headers: undefined as any,
          })
        } catch (error) {
          if (error instanceof ResponseError) {
            expect(error.message).toBe('Bad Request')
            expect(error.response?.status).toBe(400)
            const responseJson: { errors: Ajv.ErrorObject[] } = await error.response.json()
            expect(
              responseJson.errors.find((e) => e.keyword === 'required' && e.message?.includes('foo')),
            ).toBeDefined()
          }
        }
      })
    })
    it('Should validate body', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        expect.assertions(3)
        try {
          await client({
            method: 'POST',
            action: '/validate-body',
            body: undefined as any,
          })
        } catch (error) {
          if (error instanceof ResponseError) {
            expect(error.message).toBe('Bad Request')
            expect(error.response?.status).toBe(400)
            const responseJson: { errors: Ajv.ErrorObject[] } = await error.response.json()
            expect(responseJson.errors[0].params.missingProperty).toEqual('body')
          }
        }
      })
    })
  })

  describe('Validation Success', () => {
    it('Should validate query', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        const result = await client({
          method: 'GET',
          action: '/validate-query',
          query: {
            foo: 'foo',
            bar: 2,
            baz: false,
          },
        })
        expect(result.response.status).toBe(200)
        expect(result.result.foo).toBe('foo')
        expect(result.result.bar).toBe(2)
        expect(result.result.baz).toBe(false)
      })
    })
    it('Should validate url', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        const result = await client({
          method: 'GET',
          action: '/validate-url/:id',
          url: { id: 3 },
        })
        expect(result.response.status).toBe(200)
        expect(result.result.id).toBe(3)
      })
    })
    it('Should validate headers', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        const result = await client({
          method: 'GET',
          action: '/validate-headers',
          headers: {
            foo: 'foo',
            bar: 42,
            baz: true,
          },
        })
        expect(result.response.status).toBe(200)
        expect(result.result.foo).toBe('foo')
        expect(result.result.bar).toBe(42)
        expect(result.result.baz).toBe(true)
      })
    })
    it('Should validate body', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        const result = await client({
          method: 'POST',
          action: '/validate-body',
          body: {
            foo: 'foo',
            bar: 42,
            baz: true,
          },
        })

        expect(result.response.status).toBe(200)
        expect(result.result.foo).toBe('foo')
        expect(result.result.bar).toBe(42)
        expect(result.result.baz).toBe(true)
      })
    })
  })
})
