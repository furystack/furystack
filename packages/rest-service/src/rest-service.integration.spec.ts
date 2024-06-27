import { InMemoryStore, User, addStore } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import type { RestApi } from '@furystack/rest'
import { serializeValue } from '@furystack/rest'
import { PathHelper, usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { GetCurrentUser, IsAuthenticated, LoginAction, LogoutAction } from './actions/index.js'
import './helpers'
import { useHttpAuthentication, useRestService } from './helpers.js'
import { DefaultSession } from './models/default-session.js'
import { JsonResult } from './request-action-implementation.js'

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

const createIntegrationApi = async () => {
  const i = new Injector()
  const port = getPort()
  const root = 'test-api'

  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
    new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
  )
  useHttpAuthentication(i, {
    getUserStore: (sm) => sm.getStoreFor(User, 'username'),
    getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
  })
  await useRestService<IntegrationTestApi>({
    injector: i,
    root,
    port,
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

  return {
    apiUrl: `http://127.0.0.1:${port}/${root}`,
    port,
    [Symbol.asyncDispose]: i[Symbol.asyncDispose].bind(i),
  }
}

describe('@furystack/rest-service inregration tests', () => {
  it('Should be started and disposed', async () => {
    await usingAsync(await createIntegrationApi(), async () => {})
  })

  it('Should respond with 404 when a route is not found', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const result = await fetch(PathHelper.joinPaths(apiUrl, 'some-route-that-does-not-exists'), {
        method: 'GET',
      })
      expect(result.ok).toBe(false)
      expect(result.status).toBe(404)
      const responseText = await result.json()
      expect(responseText).toEqual({ error: 'Content not found' })
    })
  })

  it('Should respond with 401 for unauthorized request errors', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const result = await fetch(PathHelper.joinPaths(apiUrl, 'currentUser'))
      expect(result.ok).toBe(false)
      expect(result.status).toBe(401)
      const responseText = await result.json()
      expect(responseText).toEqual({ error: 'unauthorized' })
    })
  })

  it('Should respond with 401 for unauthorized request errors', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const result = await fetch(PathHelper.joinPaths(apiUrl, 'currentUser'))
      expect(result.ok).toBe(false)
      expect(result.status).toBe(401)
      const responseText = await result.json()
      expect(responseText).toEqual({ error: 'unauthorized' })
    })
  })

  it('Should respond with the correct result body', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'isAuthenticated'))
      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result).toEqual({ isAuthenticated: false })
    })
  })

  it('Should be able to read query parameters', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      console.log('apiUrl', apiUrl)
      const response = await fetch(PathHelper.joinPaths(apiUrl, `testQuery?param1=${serializeValue('foo')}`))
      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result).toEqual({ param1Value: 'foo' })
    })
  })

  it('Should be able to read url parameters', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testUrlParams/bar'))
      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result).toEqual({ urlParamValue: 'bar' })
    })
  })

  it('Should be able to read post body', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testPostBody'), {
        method: 'POST',
        body: JSON.stringify({ value: 'baz' }),
      })
      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result).toEqual({ bodyValue: 'baz', body2Value: 'baz' })
    })
  })

  it('Should respond with OK to OPTIONS requests', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testPostBody'), {
        method: 'OPTIONS',
      }).catch((e) => {
        console.log(e)
        throw e
      })
      expect(response.status).toBe(200)
    })
  })

  it('Should reject requests outside of the API Root', async () => {
    await usingAsync(await createIntegrationApi(), async ({ port }) => {
      await expect(fetch(PathHelper.joinPaths(`http://127.0.0.1:${port}`, 'not-my-api-root'))).rejects.toThrowError(
        'fetch failed',
      )
    })
  })
})
