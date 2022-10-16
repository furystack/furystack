import { Injector } from '@furystack/inject'
import './helpers'
import { usingAsync, PathHelper } from '@furystack/utils'

import type { RestApi } from '@furystack/rest'
import { User, InMemoryStore, addStore } from '@furystack/core'
import { DefaultSession } from './models/default-session.js'
import { JsonResult } from './request-action-implementation.js'
import { useHttpAuthentication, useRestService } from './helpers.js'
import { describe, expect, it } from 'vitest'
import { GetCurrentUser } from './actions/get-current-user.js'
import { IsAuthenticated } from './actions/is-authenticated.js'
import { LoginAction } from './actions/login.js'
import { LogoutAction } from './actions/logout.js'

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

const prepareInjector = async (i: Injector) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
    new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
  )
  useHttpAuthentication(i, {
    getUserStore: (sm) => sm.getStoreFor(UserWithPassword, 'username'),
    getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
  })
  await useRestService<IntegrationTestApi>({
    injector: i,
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
          const body2 = await options.getBody()
          return JsonResult({ bodyValue: body.value, body2Value: body2.value })
        },
      },
    },
  })
}

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
      const result = await fetch(PathHelper.joinPaths(apiUrl, 'some-route-that-does-not-exists'))
      expect(result.status).toBe(404)
    })
  })

  it('Should respond with 401 for unauthorized request errors', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const result = await fetch(PathHelper.joinPaths(apiUrl, 'currentUser'))
      expect(result.status).toBe(401)
      expect(result.ok).toBe(false)
    })
  })

  it('Should respond with the correct result body', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'isAuthenticated'))
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toStrictEqual({ isAuthenticated: false })
    })
  })

  it('Should be able to read query parameters', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testQuery?param1=foo'))
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toStrictEqual({ param1Value: 'foo' })
    })
  })

  it('Should be able to read url parameters', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testUrlParams/bar'))
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toStrictEqual({ urlParamValue: 'bar' })
    })
  })

  it('Should be able to read post body', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testPostBody'), {
        method: 'POST',
        body: JSON.stringify({ value: 'baz' }),
      })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toStrictEqual({ bodyValue: 'baz', body2Value: 'baz' })
    })
  })

  it('Should respond with OK to OPTIONS requests', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testPostBody'), {
        method: 'OPTIONS',
      })
      expect(response.status).toBe(200)
    })
  })

  it('Should reject requests outside of the API Root', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      await expect(
        async () => await fetch(PathHelper.joinPaths(`http://${hostName}:${port}`, 'not-my-api-root')),
      ).rejects.toThrowError('fetch failed')
    })
  })
})
