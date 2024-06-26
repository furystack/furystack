import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import type { RestApi } from '@furystack/rest'
import { createClient } from '@furystack/rest-client-fetch'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from './helpers.js'
import { JsonResult } from './request-action-implementation.js'

export interface EchoApi extends RestApi {
  GET: {
    '/plain': { result: unknown }
    '/headers': { headers: { value?: string }; result: { headers: { value?: string } } }
    '/urlParams/:id': { url: { id: string }; result: { url: { id: string } } }
    '/query': {
      query: { someObject: { foo: string } }
      result: { query: { someObject: { foo: string } } }
    }
    '/segment': { result: { name: 'segment' } }
    '/segment/subsegment': { result: { name: 'segment-subsegment' } }
    '/segment/:id/subsegment': { url: { id: string }; result: { url: { id: string; name: 'segment-subsegment' } } }
    '/segment{/:optionalId}?/optionalSubsegment/': {
      url: { optionalId?: string }
      result: { url: { optionalId?: string }; name: 'optional-id' }
    }
  }
  POST: {
    '/body': { body: { foo: string; bar: number }; result: { body: { foo: string; bar: number } } }
  }
}

const createEchoApiServer = async () => {
  const port = getPort()
  const root = '/api'
  const injector = new Injector()
  await useRestService<EchoApi>({
    injector,
    port,
    root,
    api: {
      GET: {
        '/plain': async () => JsonResult({}),
        '/headers': async ({ headers }) => JsonResult({ headers }),
        '/query': async ({ getQuery }) => JsonResult({ query: getQuery() }),
        '/urlParams/:id': async ({ getUrlParams }) => JsonResult({ url: getUrlParams() }),
        '/segment': async () => JsonResult({ name: 'segment' }),
        '/segment/subsegment': async () => JsonResult({ name: 'segment-subsegment' }),
        '/segment/:id/subsegment': async ({ getUrlParams }) =>
          JsonResult({ url: { ...getUrlParams(), name: 'segment-subsegment' } }),
        '/segment{/:optionalId}?/optionalSubsegment/': async ({ getUrlParams }) =>
          JsonResult({ url: getUrlParams(), name: 'optional-id' }),
      },
      POST: {
        '/body': async ({ getBody }) => JsonResult({ body: await getBody() }),
      },
    },
  })
  const client = createClient<EchoApi>({
    endpointUrl: `http://127.0.0.1:${port}/api`,
  })
  return {
    [Symbol.asyncDispose]: injector[Symbol.asyncDispose].bind(injector),
    root,
    port,
    client,
  }
}

describe('REST Integration tests with FETCH client', () => {
  it('Should execute a single parameterless GET query', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({
        method: 'GET',
        action: '/plain',
      })
      expect(result.response.status).toBe(200)
      expect(result.result).toEqual({})
    })
  })

  it('Should execute a request with headers', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const value = 'value'
      const result = await client({
        method: 'GET',
        action: '/headers',
        headers: {
          value,
        },
      })
      expect(result.response.status).toBe(200)
      expect(result.result.headers.value).toEqual(value)
    })
  })

  it('Should execute a request with query', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const value = 'value2'
      const result = await client({
        method: 'GET',
        action: '/query',
        query: {
          someObject: {
            foo: value,
          },
        },
      })
      expect(result.response.status).toBe(200)
      expect(result.result.query.someObject.foo).toEqual(value)
    })
  })

  it('Should execute a request with URL parameters', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const value = 'value3'
      const result = await client({
        method: 'GET',
        action: '/urlParams/:id',
        url: {
          id: value,
        },
      })
      expect(result.response.status).toBe(200)
      expect(result.result.url.id).toEqual(value)
    })
  })

  it('should execute a request for a segment', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({
        method: 'GET',
        action: '/segment',
      })
      expect(result.response.status).toBe(200)
      expect(result.result.name).toEqual('segment')
    })
  })

  it('should execute a request for a subsegment', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({
        method: 'GET',
        action: '/segment/subsegment',
      })
      expect(result.response.status).toBe(200)
      expect(result.result.name).toEqual('segment-subsegment')
    })
  })

  it('should execute a request for a subsegment with URL parameters', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const value = 'value4'
      const result = await client({
        method: 'GET',
        action: '/segment/:id/subsegment',
        url: {
          id: value,
        },
      })
      expect(result.response.status).toBe(200)
      expect(result.result.url.id).toEqual(value)
      expect(result.result.url.name).toEqual('segment-subsegment')
    })
  })
  it('should evaluate optional parameters in the URL', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({
        method: 'GET',
        action: '/segment{/:optionalId}?/optionalSubsegment/',
        url: {},
      })
      expect(result.response.status).toBe(200)
      expect(result.result.url.optionalId).toBeUndefined()
      expect(result.result.name).toEqual('optional-id')

      const result2 = await client({
        method: 'GET',
        action: '/segment{/:optionalId}?/optionalSubsegment/',
        url: {
          optionalId: 'value',
        },
      })
      expect(result2.response.status).toBe(200)
      expect(result2.result.url.optionalId).toEqual('value')
      expect(result2.result.name).toEqual('optional-id')
    })
  })
})
