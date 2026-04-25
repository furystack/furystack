import type { User } from '@furystack/core'
import { AuthorizationError, IdentityContext } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { Authorize } from './authorize.js'
import { EmptyResult } from './request-action-implementation.js'

describe('Authorize', () => {
  const response = {} as ServerResponse
  const request = { url: 'http://google.com' } as IncomingMessage

  it('throws AuthorizationError when the current user cannot be resolved', async () => {
    await usingAsync(createInjector(), async (i) => {
      const isAuthorized = vi.fn(async () => false)
      i.bind(IdentityContext, () => ({
        isAuthorized,
        getCurrentUser: () => Promise.reject(new Error(':(')),
        isAuthenticated: () => Promise.resolve(false),
      }))
      const exampleAction = vi.fn(async () => EmptyResult())
      const authorized = Authorize('Role1')(exampleAction)

      await expect(() => authorized({ injector: i, request, response })).rejects.toThrow(AuthorizationError)
      expect(exampleAction).not.toHaveBeenCalled()
    })
  })

  it('throws AuthorizationError when the current user does not have the required role', async () => {
    await usingAsync(createInjector(), async (i) => {
      const isAuthorized = vi.fn(async () => false)
      i.bind(IdentityContext, () => ({
        isAuthorized,
        getCurrentUser: <TUser extends User>() =>
          Promise.resolve({ username: 'a', roles: ['Role1'] } as unknown as TUser),
        isAuthenticated: () => Promise.resolve(true),
      }))
      const exampleAction = vi.fn(async () => EmptyResult())
      const authorized = Authorize('Role2')(exampleAction)

      await expect(() => authorized({ injector: i, request, response })).rejects.toThrow(AuthorizationError)
      expect(exampleAction).not.toHaveBeenCalled()
    })
  })

  it('invokes the wrapped action when the current user holds the required role', async () => {
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () => ({
        isAuthorized: () => Promise.resolve(true),
        getCurrentUser: <TUser extends User>() =>
          Promise.resolve({ username: 'a', roles: ['Role1'] } as unknown as TUser),
        isAuthenticated: () => Promise.resolve(true),
      }))
      const exampleAction = vi.fn(async () => EmptyResult())
      const authorized = Authorize('Role1')(exampleAction)
      const params = { injector: i, request, response }
      const result = await authorized(params)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(exampleAction).toHaveBeenCalledWith(params)
    })
  })
})
