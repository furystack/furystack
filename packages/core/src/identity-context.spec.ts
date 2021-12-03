import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { IdentityContext } from './identity-context'
import './injector-extensions'
import { getCurrentUser, isAuthenticated, isAuthorized } from './injector-extensions'

describe('IdentityContext', () => {
  it('Should be retrieved from an Injector', () => {
    using(new Injector(), (i) => {
      const ctx = i.getInstance(IdentityContext)
      expect(ctx).toBeInstanceOf(IdentityContext)
    })
  })

  it('isAuthenticated should be called from extension', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = i.getInstance(IdentityContext)
      const spy = jest.spyOn(ctx, 'isAuthenticated')
      const is = await isAuthenticated(i)
      expect(is).toBeFalsy()
      expect(spy).toBeCalledTimes(1)
    })
  })

  it('isAuthorized should be called from extension', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = i.getInstance(IdentityContext)
      const spy = jest.spyOn(ctx, 'isAuthorized')
      const is = await isAuthorized(i)
      expect(is).toBeFalsy()
      expect(spy).toBeCalledTimes(1)
    })
  })

  it('getCurrentUser should be called from extension', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = i.getInstance(IdentityContext)
      const spy = jest.spyOn(ctx, 'getCurrentUser')
      await expect(getCurrentUser(i)).rejects.toThrowError('')
      expect(spy).toBeCalledTimes(1)
    })
  })
})
