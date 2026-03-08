import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { getCurrentUser, isAuthenticated, isAuthorized } from './helpers.js'
import { IdentityContext } from './identity-context.js'

describe('IdentityContext', () => {
  it('Should throw when no explicit instance is set', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(() => i.getInstance(IdentityContext)).toThrow("'IdentityContext'")
    })
  })

  it('Should be retrieved from an Injector after setExplicitInstance', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = new IdentityContext()
      i.setExplicitInstance(ctx, IdentityContext)
      expect(i.getInstance(IdentityContext)).toBe(ctx)
    })
  })

  it('Should be inherited by a child injector', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = new IdentityContext()
      i.setExplicitInstance(ctx, IdentityContext)
      await usingAsync(i.createChild(), async (child) => {
        expect(child.getInstance(IdentityContext)).toBe(ctx)
      })
    })
  })

  it('isAuthenticated should be called from helper', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = new IdentityContext()
      i.setExplicitInstance(ctx, IdentityContext)
      const spy = vi.spyOn(ctx, 'isAuthenticated')
      const isAuth = await isAuthenticated(i)
      expect(isAuth).toBeFalsy()
      expect(spy).toBeCalledTimes(1)
    })
  })

  it('isAuthorized should be called from helper', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = new IdentityContext()
      i.setExplicitInstance(ctx, IdentityContext)
      const spy = vi.spyOn(ctx, 'isAuthorized')
      const isAuth = await isAuthorized(i)
      expect(isAuth).toBeFalsy()
      expect(spy).toBeCalledTimes(1)
    })
  })

  it('getCurrentUser should be called from helper', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = new IdentityContext()
      i.setExplicitInstance(ctx, IdentityContext)
      const spy = vi.spyOn(ctx, 'getCurrentUser')
      await expect(getCurrentUser(i)).rejects.toThrowError('No IdentityContext')
      expect(spy).toBeCalledTimes(1)
    })
  })
})
