import { getStoreManager, InMemoryStore, User } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { createClient, ResponseError } from '@furystack/rest-client-fetch'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from './helpers.js'
import { DefaultSession } from './models/default-session.js'
import { JsonResult } from './request-action-implementation.js'
import type { ValidationApi } from './validate.integration.schema.js'
import schema from './validate.integration.spec.schema.json' with { type: 'json' }
import { Validate } from './validate.js'

// To recreate: yarn ts-json-schema-generator -f tsconfig.json --no-type-check -p packages/rest-service/src/validate.integration.schema.ts -o packages/rest-service/src/validate.integration.spec.schema.json

const createValidateApi = async () => {
  const injector = new Injector()
  const port = getPort()

  getStoreManager(injector).addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
  getStoreManager(injector).addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))

  await useRestService<ValidationApi>({
    injector,
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
    client,
  }
}

describe('Validation integration tests', () => {
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
            const responseJson = await error.response.json()
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
            const responseJson = await error.response.json()
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
            const responseJson = await error.response.json()
            expect(
              responseJson.errors.find((e: any) => e.keyword === 'required' && e.message.includes('foo')),
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
            const responseJson = await error.response.json()
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
