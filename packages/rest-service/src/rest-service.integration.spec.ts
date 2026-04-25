import { InMemoryStore, User as UserModel } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import type { RestApi } from '@furystack/rest'
import { serializeValue } from '@furystack/rest'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import { PathHelper, usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { GetCurrentUser, IsAuthenticated, LogoutAction, createPasswordLoginAction } from './actions/index.js'
import { useHttpAuthentication, useRestService } from './helpers.js'
import { HttpServerPoolToken } from './http-server-pool.js'
import { createCookieLoginStrategy } from './login-response-strategy.js'
import { DefaultSession } from './models/default-session.js'
import { JsonResult } from './request-action-implementation.js'
import { ServerTelemetryToken } from './server-telemetry.js'
import { SessionStore, UserStore } from './user-store.js'

interface IntegrationTestApi extends RestApi {
  GET: {
    '/isAuthenticated': { result: { isAuthenticated: boolean } }
    '/currentUser': { result: UserModel }
    '/testQuery': { query: { param1: string }; result: { param1Value: string } }
    '/testUrlParams/:urlParam': { url: { urlParam: string }; result: { urlParamValue: string } }
  }
  POST: {
    '/login': { result: UserModel; body: { username: string; password: string } }
    '/logout': { result: unknown }
    '/testPostBody': { body: { value: string }; result: { bodyValue: string } }
  }
}

const createIntegrationApi = async () => {
  const i = createInjector()
  const port = getPort()
  const root = 'test-api'

  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i)
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
        '/login': createPasswordLoginAction(createCookieLoginStrategy(i)),
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
    injector: i,
    [Symbol.asyncDispose]: i[Symbol.asyncDispose].bind(i),
  }
}

describe('@furystack/rest-service integration tests', () => {
  it('starts and disposes cleanly', async () => {
    await usingAsync(await createIntegrationApi(), async () => {})
  })

  it('responds 404 for unknown routes', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const result = await fetch(PathHelper.joinPaths(apiUrl, 'some-route-that-does-not-exist'))
      expect(result.ok).toBe(false)
      expect(result.status).toBe(404)
      const response = (await result.json()) as { error: string }
      expect(response).toEqual({ error: 'Content not found' })
    })
  })

  it('responds 401 for authenticated routes hit anonymously', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const result = await fetch(PathHelper.joinPaths(apiUrl, 'currentUser'))
      expect(result.ok).toBe(false)
      expect(result.status).toBe(401)
      const response = (await result.json()) as { error: string }
      expect(response).toEqual({ error: 'unauthorized' })
    })
  })

  it('returns JSON bodies from async actions', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'isAuthenticated'))
      expect(response.status).toBe(200)
      const result = (await response.json()) as { isAuthenticated: boolean }
      expect(result).toEqual({ isAuthenticated: false })
    })
  })

  it('deserialises query parameters', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, `testQuery?param1=${serializeValue('foo')}`))
      expect(response.status).toBe(200)
      const result = (await response.json()) as { param1Value: string }
      expect(result).toEqual({ param1Value: 'foo' })
    })
  })

  it('extracts url parameters', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testUrlParams/bar'))
      expect(response.status).toBe(200)
      const result = (await response.json()) as { urlParamValue: string }
      expect(result).toEqual({ urlParamValue: 'bar' })
    })
  })

  it('reads the POST body once and memoises subsequent reads', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testPostBody'), {
        method: 'POST',
        body: JSON.stringify({ value: 'baz' }),
      })
      expect(response.status).toBe(200)
      const result = (await response.json()) as { bodyValue: string; body2Value: string }
      expect(result).toEqual({ bodyValue: 'baz', body2Value: 'baz' })
    })
  })

  it('responds 200 to OPTIONS preflight requests', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testPostBody'), { method: 'OPTIONS' })
      expect(response.status).toBe(200)
    })
  })

  it('rejects requests outside the API root with a dropped socket', async () => {
    await usingAsync(await createIntegrationApi(), async ({ port }) => {
      await expect(fetch(PathHelper.joinPaths(`http://127.0.0.1:${port}`, 'not-my-api-root'))).rejects.toThrowError(
        'fetch failed',
      )
    })
  })

  it('responds 400 for malformed query-parameter values', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(PathHelper.joinPaths(apiUrl, 'testQuery?param1=not-valid-base64!!!'))
      expect(response.status).toBe(400)
      const result = (await response.json()) as { message: string }
      expect(result.message).toBe('Failed to decode query parameter value')
    })
  })

  it('responds 400 for malformed percent-encoded path parameters', async () => {
    await usingAsync(await createIntegrationApi(), async ({ apiUrl }) => {
      const response = await fetch(`${apiUrl}/testUrlParams/%E0%A4%A`)
      expect(response.status).toBe(400)
      const result = (await response.json()) as { message: string }
      expect(result.message).toBe('Failed to decode URL path parameter')
    })
  })
})

describe('HttpServerPool telemetry', () => {
  it('emits onServerListening with the url / port / host for newly-opened servers', async () => {
    await usingAsync(createInjector(), async (i) => {
      const telemetry = i.get(ServerTelemetryToken)
      const handler = vi.fn()
      telemetry.addListener('onServerListening', handler)

      const port = getPort()
      await i.get(HttpServerPoolToken).acquire({ port })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ url: `http://localhost:${port}`, port, hostName: undefined })
    })
  })

  it('forwards the configured host name into the emitted event', async () => {
    await usingAsync(createInjector(), async (i) => {
      const telemetry = i.get(ServerTelemetryToken)
      const handler = vi.fn()
      telemetry.addListener('onServerListening', handler)

      const port = getPort()
      await i.get(HttpServerPoolToken).acquire({ port, hostName: '127.0.0.1' })

      expect(handler).toHaveBeenCalledWith({ url: `http://127.0.0.1:${port}`, port, hostName: '127.0.0.1' })
    })
  })

  it('emits onServerClosed when the pool is disposed', async () => {
    const i = createInjector()
    const telemetry = i.get(ServerTelemetryToken)
    const handler = vi.fn()
    telemetry.addListener('onServerClosed', handler)

    const port = getPort()
    await i.get(HttpServerPoolToken).acquire({ port })
    await i[Symbol.asyncDispose]()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ url: `http://localhost:${port}` })
  })

  it('does not emit onServerListening a second time for the same url', async () => {
    await usingAsync(createInjector(), async (i) => {
      const port = getPort()
      await i.get(HttpServerPoolToken).acquire({ port })

      const telemetry = i.get(ServerTelemetryToken)
      const handler = vi.fn()
      telemetry.addListener('onServerListening', handler)

      await i.get(HttpServerPoolToken).acquire({ port })

      expect(handler).not.toHaveBeenCalled()
    })
  })
})
