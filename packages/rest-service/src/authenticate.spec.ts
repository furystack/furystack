import { IdentityContext } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { Authenticate } from './authenticate.js'
import { HttpUserContext } from './http-user-context.js'
import { EmptyResult } from './request-action-implementation.js'

describe('Authenticate', () => {
  const response = {} as any as ServerResponse
  const request = { url: 'http://google.com' } as IncomingMessage

  it('Should return 401 without WWW-Authenticate header when no basic-auth provider is registered', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthenticatedAction = vi.fn(async () => false)

      i.setExplicitInstance(
        { isAuthenticated: isAuthenticatedAction, getCurrentUser: async () => Promise.reject(new Error(':(')) },
        IdentityContext,
      )

      i.setExplicitInstance(
        {
          authentication: { authenticationProviders: [] },
        },
        HttpUserContext,
      )
      const exampleAuthenticatedAction = vi.fn(async () => EmptyResult())
      const authorized = Authenticate()(exampleAuthenticatedAction)

      const result = await authorized({ injector: i, request, response })
      expect(result.statusCode).toBe(401)
      expect(result.chunk).toEqual({ error: 'unauthorized' })
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(exampleAuthenticatedAction).not.toBeCalled()
    })
  })

  it('Should return 401 with WWW-Authenticate: Basic header when basic-auth provider is registered', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthenticatedAction = vi.fn(async () => false)

      i.setExplicitInstance(
        { isAuthenticated: isAuthenticatedAction, getCurrentUser: async () => Promise.reject(new Error(':(')) },
        IdentityContext,
      )

      i.setExplicitInstance(
        {
          authentication: {
            authenticationProviders: [{ name: 'basic-auth', authenticate: async () => null }],
          },
        },
        HttpUserContext,
      )
      const exampleAuthenticatedAction = vi.fn(async () => EmptyResult())
      const authorized = Authenticate()(exampleAuthenticatedAction)

      const result = await authorized({ injector: i, request, response })
      expect(result.statusCode).toBe(401)
      expect(result.chunk).toEqual({ error: 'unauthorized' })
      expect(result.headers).toEqual({ 'Content-Type': 'application/json', 'WWW-Authenticate': 'Basic' })
      expect(exampleAuthenticatedAction).not.toBeCalled()
    })
  })

  it('Should exec the original action if authorized', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthenticatedAction = vi.fn(async () => true)
      i.setExplicitInstance(
        { isAuthenticated: isAuthenticatedAction, getCurrentUser: async () => Promise.reject(new Error(':(')) },
        IdentityContext,
      )
      const exampleAuthenticatedAction = vi.fn(async () => EmptyResult())
      const authorized = Authenticate()(exampleAuthenticatedAction)
      const params = { injector: i, body: undefined, query: undefined, request, response }
      const result = await authorized(params)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(exampleAuthenticatedAction).toBeCalledWith(params)
    })
  })
})
