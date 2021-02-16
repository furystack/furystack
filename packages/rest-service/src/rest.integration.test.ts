import { Injector } from '@furystack/inject'
import { RestApi } from '@furystack/rest'
import { createClient } from '@furystack/rest-client-got'
import { usingAsync } from '@furystack/utils'
import { JsonResult } from './request-action-implementation'
import { v4 } from 'uuid'
import './injector-extensions'

export interface EchoApi extends RestApi {
  '/plain': { GET: { result: unknown } }
  '/headers': { GET: { headers: { value: string }; result: { headers: { value: string } } } }
  '/urlParams/:id': { GET: { url: { id: string }; result: { url: { id: string } } } }
  '/query': {
    GET: {
      query: { someObject: { foo: string } }
      result: { query: { someObject: { foo: string } } }
    }
  }
  '/body': { POST: { body: { foo: string; bar: number }; result: { body: { foo: string; bar: number } } } }
}

const createEchoApiServer = async () => {
  const port = Math.round(Math.random() * 1000) + 10000
  const root = '/api'
  const injector = new Injector()
  await injector.useRestService<EchoApi>({
    port,
    root,
    api: {
      '/plain': { GET: async () => JsonResult({}) },
      '/headers': { GET: async ({ headers }) => JsonResult({ headers }) },
      '/query': { GET: async ({ getQuery }) => JsonResult({ query: getQuery() }) },
      '/urlParams/:id': { GET: async ({ getUrlParams }) => JsonResult({ url: getUrlParams() }) },
      '/body': { POST: async ({ getBody }) => JsonResult({ body: await getBody() }) },
    },
  })
  const client = createClient<EchoApi>({
    endpointUrl: `http://localhost:${port}/api`,
  })
  return {
    dispose: injector.dispose.bind(injector),
    root,
    port,
    client,
  }
}

describe('REST Integration tests with GOT client', () => {
  it('Should execute a single parameterless GET query', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const result = await client({
        method: 'GET',
        action: '/plain',
      })
      expect(result.response.statusCode).toBe(200)
      expect(result.getJson()).toStrictEqual({})
    })
  })

  it('Should execute a request with headers', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const value = v4()
      const result = await client({
        method: 'GET',
        action: '/headers',
        headers: {
          value,
        },
      })
      expect(result.response.statusCode).toBe(200)
      expect(result.getJson().headers.value).toStrictEqual(value)
    })
  })

  it('Should execute a request with query', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const value = v4()
      const result = await client({
        method: 'GET',
        action: '/query',
        query: {
          someObject: {
            foo: value,
          },
        },
      })
      expect(result.response.statusCode).toBe(200)
      expect(result.getJson().query.someObject.foo).toStrictEqual(value)
    })
  })

  it('Should execute a request with URL parameters', async () => {
    await usingAsync(await createEchoApiServer(), async ({ client }) => {
      const value = v4()
      const result = await client({
        method: 'GET',
        action: '/urlParams/:id',
        url: {
          id: value,
        },
      })
      expect(result.response.statusCode).toBe(200)
      expect(result.getJson().url.id).toEqual(value)
    })
  })
})
