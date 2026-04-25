import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
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
  const injector = createInjector()
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
  it('executes a parameterless GET request', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({ method: 'GET', action: '/plain' })
      expect(result.response.status).toBe(200)
      expect(result.result).toEqual({})
    })
  })

  it('passes headers through', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({ method: 'GET', action: '/headers', headers: { value: 'hello' } })
      expect(result.response.status).toBe(200)
      expect(result.result.headers.value).toBe('hello')
    })
  })

  it('serialises url params', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({ method: 'GET', action: '/urlParams/:id', url: { id: '42' } })
      expect(result.result.url.id).toBe('42')
    })
  })

  it('serialises a structured query', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({
        method: 'GET',
        action: '/query',
        query: { someObject: { foo: 'bar' } },
      })
      expect(result.result.query.someObject.foo).toBe('bar')
    })
  })

  it('dispatches plain and multi-segment URLs correctly', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      expect((await client({ method: 'GET', action: '/segment' })).result.name).toBe('segment')
      expect((await client({ method: 'GET', action: '/segment/subsegment' })).result.name).toBe('segment-subsegment')
      const subsegment = await client({
        method: 'GET',
        action: '/segment/:id/subsegment',
        url: { id: 'abc' },
      })
      expect(subsegment.result.url.id).toBe('abc')
      expect(subsegment.result.url.name).toBe('segment-subsegment')
    })
  })

  it('forwards POST bodies', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({
        method: 'POST',
        action: '/body',
        body: { foo: 'hi', bar: 42 },
      })
      expect(result.result.body).toEqual({ foo: 'hi', bar: 42 })
    })
  })
})
