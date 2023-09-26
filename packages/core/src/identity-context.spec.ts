import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { IdentityContext } from './identity-context.js'
import { isAuthorized, isAuthenticated, getCurrentUser } from './helpers.js'
import { describe, it, expect, vi } from 'vitest'

describe('IdentityContext', () => {
  it('Should be retrieved from an Injector', () => {
    using(new Injector(), (i) => {
      const ctx = i.getInstance(IdentityContext)
      expect(ctx).toBeInstanceOf(IdentityContext)
    })
  })

  it('isAuthenticated should be called from helper', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = i.getInstance(IdentityContext)
      const spy = vi.spyOn(ctx, 'isAuthenticated')
      const isAuth = await isAuthenticated(i)
      expect(isAuth).toBeFalsy()
      expect(spy).toBeCalledTimes(1)
    })
  })

  it('isAuthorized should be called from helper', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = i.getInstance(IdentityContext)
      const spy = vi.spyOn(ctx, 'isAuthorized')
      const isAuth = await isAuthorized(i)
      expect(isAuth).toBeFalsy()
      expect(spy).toBeCalledTimes(1)
    })
  })

  it('getCurrentUser should be called from helper', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = i.getInstance(IdentityContext)
      const spy = vi.spyOn(ctx, 'getCurrentUser')
      await expect(getCurrentUser(i)).rejects.toThrowError('')
      expect(spy).toBeCalledTimes(1)
    })
  })
})
