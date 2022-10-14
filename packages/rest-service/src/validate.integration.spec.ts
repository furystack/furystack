import { Injector } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-got'
import { usingAsync } from '@furystack/utils'
import { RequestError } from 'got/dist/source'
import { JsonResult } from './request-action-implementation.js'
import { Validate } from './validate.js'
import './helpers'

import schema from './validate.integration.spec.schema.json'
import type { ValidationApi } from './validate.integration.schema.js'
import { useRestService } from './helpers.js'
import { describe, expect, it } from 'vitest'

/**
 * Generator for an incremental port number
 *
 * @param port The initial port number
 * @yields a port for testing
 * @returns a port for testing
 */
function* getPort(port = 4321) {
  while (true) {
    port = port + 2
    yield port
  }
  return port
}

// To recreate: yarn ts-json-schema-generator -f tsconfig.json --no-type-check -p packages/rest-service/src/validate.integration.schema.ts -o packages/rest-service/src/validate.integration.spec.schema.json

const createValidateApi = async (port: number) => {
  const injector = new Injector()
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
  const client = await createClient<ValidationApi>({
    endpointUrl: `http://localhost:${port}/api`,
  })
  return {
    dispose: async () => {
      await injector.dispose.bind(injector)
    },
    client,
  }
}

describe('Validation integration tests', () => {
  const portGenerator = getPort()

  describe('Validation errors', () => {
    it('Should validate query', async () => {
      await usingAsync(await createValidateApi(portGenerator.next().value), async ({ client }) => {
        expect.assertions(5)
        try {
          await client({
            method: 'GET',
            action: '/validate-query',
            query: undefined as any,
          })
        } catch (error) {
          if (error instanceof RequestError) {
            expect(error.message).toBe('Response code 400 (Bad Request)')
            expect(error.response?.statusCode).toBe(400)
            const responseJson = JSON.parse(error.response?.body as string)
            expect(responseJson.errors[0].params.missingProperty).toEqual('foo')
            expect(responseJson.errors[1].params.missingProperty).toEqual('bar')
            expect(responseJson.errors[2].params.missingProperty).toEqual('baz')
          }
        }
      })
    })
    it('Should validate url', async () => {
      await usingAsync(await createValidateApi(portGenerator.next().value), async ({ client }) => {
        expect.assertions(4)
        try {
          await client({
            method: 'GET',
            action: '/validate-url/:id',
            url: undefined as any,
          })
        } catch (error) {
          if (error instanceof RequestError) {
            expect(error.message).toBe('Response code 400 (Bad Request)')
            expect(error.response?.statusCode).toBe(400)
            const responseJson = JSON.parse(error.response?.body as string)
            expect(responseJson.errors[0].params.type).toEqual('number')
            expect(responseJson.errors[0].instancePath).toEqual('/url/id')
          }
        }
      })
    })
    it('Should validate headers', async () => {
      await usingAsync(await createValidateApi(portGenerator.next().value), async ({ client }) => {
        expect.assertions(3)
        try {
          await client({
            method: 'GET',
            action: '/validate-headers',
            headers: undefined as any,
          })
        } catch (error) {
          if (error instanceof RequestError) {
            expect(error.message).toBe('Response code 400 (Bad Request)')
            expect(error.response?.statusCode).toBe(400)
            const responseJson = JSON.parse(error.response?.body as string)
            expect(
              responseJson.errors.find((e: any) => e.keyword === 'required' && e.message.includes('foo')),
            ).toBeDefined()
          }
        }
      })
    })
    it('Should validate body', async () => {
      await usingAsync(await createValidateApi(portGenerator.next().value), async ({ client }) => {
        expect.assertions(3)
        try {
          await client({
            method: 'POST',
            action: '/validate-body',
            body: undefined as any,
          })
        } catch (error) {
          if (error instanceof RequestError) {
            expect(error.message).toBe('Response code 400 (Bad Request)')
            expect(error.response?.statusCode).toBe(400)
            const responseJson = JSON.parse(error.response?.body as string)
            expect(responseJson.errors[0].params.missingProperty).toEqual('body')
          }
        }
      })
    })
  })

  describe('Validation Success', () => {
    it('Should validate query', async () => {
      await usingAsync(await createValidateApi(portGenerator.next().value), async ({ client }) => {
        const result = await client({
          method: 'GET',
          action: '/validate-query',
          query: {
            foo: 'foo',
            bar: 2,
            baz: false,
          },
        })
        expect(result.response.statusCode).toBe(200)
        const responseJson = result.getJson()
        expect(responseJson.foo).toBe('foo')
        expect(responseJson.bar).toBe(2)
        expect(responseJson.baz).toBe(false)
      })
    })
    it('Should validate url', async () => {
      await usingAsync(await createValidateApi(portGenerator.next().value), async ({ client }) => {
        const result = await client({
          method: 'GET',
          action: '/validate-url/:id',
          url: { id: 3 },
        })
        expect(result.response.statusCode).toBe(200)
        const responseJson = result.getJson()
        expect(responseJson.id).toBe(3)
      })
    })
    it('Should validate headers', async () => {
      await usingAsync(await createValidateApi(portGenerator.next().value), async ({ client }) => {
        try {
          const result = await client({
            method: 'GET',
            action: '/validate-headers',
            headers: {
              foo: 'foo',
              bar: 42,
              baz: true,
            },
          })
          expect(result.response.statusCode).toBe(200)
          const responseJson = result.getJson()
          expect(responseJson.foo).toBe('foo')
          expect(responseJson.bar).toBe(42)
          expect(responseJson.baz).toBe(true)
        } catch (error) {
          console.error(error)
        }
      })
    })
    it('Should validate body', async () => {
      await usingAsync(await createValidateApi(portGenerator.next().value), async ({ client }) => {
        const result = await client({
          method: 'POST',
          action: '/validate-body',
          body: {
            foo: 'foo',
            bar: 42,
            baz: true,
          },
        })

        expect(result.response.statusCode).toBe(200)
        const responseJson = result.getJson()
        expect(responseJson.foo).toBe('foo')
        expect(responseJson.bar).toBe(42)
        expect(responseJson.baz).toBe(true)
      })
    })
  })
})
