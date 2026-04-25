import { IdentityContext } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { EventHub, usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { Authenticate } from './authenticate.js'
import type { HttpUserContext } from './http-user-context.js'
import { HttpUserContext as HttpUserContextToken } from './http-user-context.js'
import { EmptyResult } from './request-action-implementation.js'

const makeHttpUserContextStub = (providers: Array<{ name: string }>): HttpUserContext =>
  Object.assign(new EventHub(), {
    authentication: { authenticationProviders: providers },
  }) as unknown as HttpUserContext

describe('Authenticate', () => {
  const response = {} as ServerResponse
  const request = { url: 'http://google.com' } as IncomingMessage

  it('returns 401 without WWW-Authenticate when no basic-auth provider is registered', async () => {
    await usingAsync(createInjector(), async (i) => {
      const isAuthenticated = vi.fn(async () => false)
      i.bind(IdentityContext, () => ({
        isAuthenticated,
        getCurrentUser: () => Promise.reject(new Error(':(')),
        isAuthorized: () => Promise.resolve(false),
      }))
      i.bind(HttpUserContextToken, () => makeHttpUserContextStub([]))

      const exampleAction = vi.fn(async () => EmptyResult())
      const authorized = Authenticate()(exampleAction)

      const result = await authorized({ injector: i, request, response })
      expect(result.statusCode).toBe(401)
      expect(result.chunk).toEqual({ error: 'unauthorized' })
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(exampleAction).not.toHaveBeenCalled()
    })
  })

  it('returns 401 with WWW-Authenticate: Basic when a basic-auth provider is registered', async () => {
    await usingAsync(createInjector(), async (i) => {
      const isAuthenticated = vi.fn(async () => false)
      i.bind(IdentityContext, () => ({
        isAuthenticated,
        getCurrentUser: () => Promise.reject(new Error(':(')),
        isAuthorized: () => Promise.resolve(false),
      }))
      i.bind(HttpUserContextToken, () => makeHttpUserContextStub([{ name: 'basic-auth' }]))

      const exampleAction = vi.fn(async () => EmptyResult())
      const authorized = Authenticate()(exampleAction)

      const result = await authorized({ injector: i, request, response })
      expect(result.statusCode).toBe(401)
      expect(result.chunk).toEqual({ error: 'unauthorized' })
      expect(result.headers).toEqual({ 'Content-Type': 'application/json', 'WWW-Authenticate': 'Basic' })
      expect(exampleAction).not.toHaveBeenCalled()
    })
  })

  it('invokes the wrapped action when the caller is authenticated', async () => {
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () => ({
        isAuthenticated: () => Promise.resolve(true),
        getCurrentUser: () => Promise.reject(new Error(':(')),
        isAuthorized: () => Promise.resolve(true),
      }))
      const exampleAction = vi.fn(async () => EmptyResult())
      const authorized = Authenticate()(exampleAction)
      const params = { injector: i, request, response }
      const result = await authorized(params)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(exampleAction).toHaveBeenCalledWith(params)
    })
  })
})
