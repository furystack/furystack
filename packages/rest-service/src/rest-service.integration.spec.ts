import { Injector } from '@furystack/inject'
import './injector-extensions'
import { usingAsync, PathHelper } from '@furystack/utils'
import { GetCurrentUser, IsAuthenticated, LoginAction, LogoutAction } from './actions'
import { RestApi } from '@furystack/rest'
import { User, InMemoryStore } from '@furystack/core'
import { DefaultSession } from './models/default-session'
import got from 'got'
import { JsonResult } from './request-action-implementation'

class UserWithPassword extends User {
  password!: string
}

interface IntegrationTestApi extends RestApi {
  GET: {
    '/isAuthenticated': { result: { isAuthenticated: boolean } }
    '/currentUser': { result: User }
    '/testQuery': { query: { param1: string }; result: { param1Value: string } }
    '/testUrlParams/:urlParam': { url: { urlParam: string }; result: { urlParamValue: string } }
  }
  POST: {
    '/login': { result: User; body: { username: string; password: string } }
    '/logout': { result: unknown }
    '/testPostBody': { body: { value: string }; result: { bodyValue: string } }
  }
}

const port = 19090
const hostName = 'localhost'
const root = 'test-api'

const prepareInjector = (i: Injector) =>
  i
    .setupStores((sm) =>
      sm
        .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
        .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' })),
    )
    .useHttpAuthentication({
      getUserStore: (sm) => sm.getStoreFor(UserWithPassword, 'username'),
      getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
    })
    .useRestService<IntegrationTestApi>({
      root,
      port,
      hostName,
      cors: {
        credentials: true,
        origins: ['http://localhost:8080'],
        headers: ['cache', 'content-type'],
      },
      api: {
        GET: {
          '/currentUser': GetCurrentUser,
          '/isAuthenticated': IsAuthenticated,
          '/testQuery': async (options) => JsonResult({ param1Value: options.getQuery().param1 }),
          '/testUrlParams/:urlParam': async (options) => JsonResult({ urlParamValue: options.getUrlParams().urlParam }),
        },
        POST: {
          '/login': LoginAction,
          '/logout': LogoutAction,
          '/testPostBody': async (options) => {
            const body = await options.getBody()
            return JsonResult({ bodyValue: body.value })
          },
        },
      },
    })

const apiUrl = PathHelper.joinPaths(`http://${hostName}:${port}`, root)

describe('@furystack/rest-service inregration tests', () => {
  it('Should be started and disposed', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
    })
  })

  it('Should respond with 404 when a route is not found', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      await expect(got(PathHelper.joinPaths(apiUrl, 'some-route-that-does-not-exists'))).rejects.toThrow(
        'Response code 404 (Not Found)',
      )
    })
  })

  it('Should respond with 401 for unauthorized request errors', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      await expect(got(PathHelper.joinPaths(apiUrl, 'currentUser'), { retry: 0 })).rejects.toThrow(
        'Response code 401 (Unauthorized)',
      )
    })
  })

  it('Should respond with 401 for unauthorized request errors', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      await expect(got(PathHelper.joinPaths(apiUrl, 'currentUser'), { retry: 0 })).rejects.toThrow(
        'Response code 401 (Unauthorized)',
      )
    })
  })

  it('Should respond with the correct result body', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await got(PathHelper.joinPaths(apiUrl, 'isAuthenticated'), { retry: 0 })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toStrictEqual({ isAuthenticated: false })
    })
  })

  it('Should be able to read query parameters', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await got(PathHelper.joinPaths(apiUrl, 'testQuery?param1=foo'), { retry: 0 })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toStrictEqual({ param1Value: 'foo' })
    })
  })

  it('Should be able to read url parameters', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await got(PathHelper.joinPaths(apiUrl, 'testUrlParams/bar'), { retry: 0 })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toStrictEqual({ urlParamValue: 'bar' })
    })
  })

  it('Should be able to read post body', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await got(PathHelper.joinPaths(apiUrl, 'testPostBody'), {
        method: 'POST',
        body: JSON.stringify({ value: 'baz' }),
        retry: 0,
      })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toStrictEqual({ bodyValue: 'baz' })
    })
  })

  it('Should respond with OK to OPTIONS requests', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await got(PathHelper.joinPaths(apiUrl, 'testPostBody'), {
        method: 'OPTIONS',
        retry: 0,
      })
      expect(response.statusCode).toBe(200)
    })
  })

  it('Should reject requests outside of the API Root', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      await expect(
        got(PathHelper.joinPaths(`http://${hostName}:${port}`, 'not-my-api-root'), { retry: 0 }),
      ).rejects.toThrowError('socket hang up')
    })
  })
})
