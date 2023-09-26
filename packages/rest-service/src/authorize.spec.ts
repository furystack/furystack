import type { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { User } from '@furystack/core'
import { IdentityContext } from '@furystack/core'
import { Authorize } from './authorize.js'
import type { ServerResponse } from 'http'
import { EmptyResult } from './request-action-implementation.js'
import { describe, it, expect, vi } from 'vitest'

describe('Authorize', () => {
  const response = {} as any as ServerResponse
  const request = { url: 'http://google.com' } as IncomingMessage

  it('Should return 403 when failed to get current user', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthorizedAction = vi.fn(async () => false)
      i.setExplicitInstance(
        { isAuthorized: isAuthorizedAction, getCurrentUser: () => Promise.reject(':(') },
        IdentityContext,
      )
      const exampleAuthorizedAction = vi.fn(async () => EmptyResult())
      const authorized = Authorize('Role1')(exampleAuthorizedAction)

      const result = await authorized({ injector: i, request, response })
      expect(result.statusCode).toBe(403)
      expect(result.chunk).toEqual({ error: 'forbidden' })
      expect(exampleAuthorizedAction).not.toBeCalled()
    })
  })

  it('Should return 403 if the current user does not have the role', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthorizedAction = vi.fn(async () => false)
      i.setExplicitInstance(
        {
          isAuthorized: isAuthorizedAction,
          getCurrentUser: async () => Promise.resolve<User>({ username: 'a', roles: ['Role1'] }),
        },
        IdentityContext,
      )
      const exampleAuthorizedAction = vi.fn(async () => EmptyResult())
      const authorized = Authorize('Role2')(exampleAuthorizedAction)

      const result = await authorized({ injector: i, request, response })
      expect(result.statusCode).toBe(403)
      expect(result.chunk).toEqual({ error: 'forbidden' })
      expect(exampleAuthorizedAction).not.toBeCalled()
    })
  })

  it('Should exec the original action if authorized', async () => {
    await usingAsync(new Injector(), async (i) => {
      const isAuthorizedAction = vi.fn(async () => true)
      i.setExplicitInstance(
        {
          isAuthorized: isAuthorizedAction,
          getCurrentUser: async () => Promise.resolve<User>({ username: 'a', roles: ['Role1'] }),
        },
        IdentityContext,
      )
      const exampleAuthorizedAction = vi.fn(async () => EmptyResult())
      const authorized = Authorize('Role1')(exampleAuthorizedAction)
      const params = { injector: i, body: undefined, query: undefined, request, response }
      const result = await authorized(params)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(exampleAuthorizedAction).toBeCalledWith(params)
    })
  })
})
