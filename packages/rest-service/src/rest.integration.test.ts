import { Injector } from '@furystack/inject'
import type { RestApi } from '@furystack/rest'
import { createClient } from '@furystack/rest-client-fetch'
import { usingAsync } from '@furystack/utils'
import { JsonResult } from './request-action-implementation'
import './helpers'
import { useRestService } from './helpers'

export interface EchoApi extends RestApi {
  GET: {
    '/plain': { result: unknown }
    '/headers': { headers: { value?: string }; result: { headers: { value?: string } } }
    '/urlParams/:id': { url: { id: string }; result: { url: { id: string } } }
    '/query': {
      query: { someObject: { foo: string } }
      result: { query: { someObject: { foo: string } } }
    }
  }
  POST: {
    '/body': { body: { foo: string; bar: number }; result: { body: { foo: string; bar: number } } }
  }
}

const createEchoApiServer = async () => {
  const port = Math.round(Math.random() * 1000) + 10000
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
      },
      POST: {
        '/body': async ({ getBody }) => JsonResult({ body: await getBody() }),
      },
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
      expect(result.response.status).toBe(200)
      expect(result.result).toStrictEqual({})
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
      expect(result.response.headers.get('value')).toStrictEqual(value)
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
      expect(result.result.query.someObject.foo).toStrictEqual(value)
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
})
