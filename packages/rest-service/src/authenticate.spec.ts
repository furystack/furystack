import type { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { HttpUserContext } from './http-user-context'
import { Authenticate } from './authenticate'
import type { ServerResponse } from 'http'
import { IdentityContext } from '@furystack/core'
import { EmptyResult } from './request-action-implementation'
import { describe, it, expect, vi } from 'vitest'

describe('Authenticate', () => {
  const response = {} as any as ServerResponse
  const request = { url: 'http://google.com' } as IncomingMessage

  it('Should return 403 w/o basic auth header, when unauthorized and basic auth is disabled', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthenticatedAction = vi.fn(async () => false)

      i.setExplicitInstance(
        { isAuthenticated: isAuthenticatedAction, getCurrentUser: async () => Promise.reject(':(') },
        IdentityContext,
      )

      i.setExplicitInstance(
        {
          authentication: { enableBasicAuth: false },
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

  it('Should return 403 with basic auth headers when unauthorized and basic auth is enabled', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthenticatedAction = vi.fn(async () => false)
      i.setExplicitInstance(
        {
          isAuthenticated: isAuthenticatedAction,
          getCurrentUser: async () => Promise.reject(':('),
          authentication: { enableBasicAuth: true },
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
        { isAuthenticated: isAuthenticatedAction, getCurrentUser: async () => Promise.reject(':(') },
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
