import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { IdentityContext } from './identity-context'
import './injector-extensions'

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
      const isAuthenticated = await i.isAuthenticated()
      expect(isAuthenticated).toBeFalsy()
      expect(spy).toBeCalledTimes(1)
    })
  })

  it('isAuthorized should be called from extension', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = i.getInstance(IdentityContext)
      const spy = jest.spyOn(ctx, 'isAuthorized')
      const isAuthorized = await i.isAuthorized()
      expect(isAuthorized).toBeFalsy()
      expect(spy).toBeCalledTimes(1)
    })
  })

  it('getCurrentUser should be called from extension', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ctx = i.getInstance(IdentityContext)
      const spy = jest.spyOn(ctx, 'isAuthorized')
      await expect(await i.isAuthorized()).rejects.toThrowError('')
      expect(spy).toBeCalledTimes(1)
    })
  })
})
