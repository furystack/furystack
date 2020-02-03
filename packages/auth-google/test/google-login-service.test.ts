import { usingAsync, using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { InMemoryStore, User, StoreManager } from '@furystack/core'
import { GoogleLoginSettings, GoogleLoginService } from '../src/login-service'

describe('Google Login Service', () => {
  describe('Settings', () => {
    it('Can parse the user from the Google Response post body', async () => {
      await usingAsync(new Injector(), async i => {
        i.setupStores(sm =>
          sm.addStore(new InMemoryStore({ model: User, primaryKey: 'username' })),
        ).useHttpAuthentication({ getUserStore: sm => sm.getStoreFor<User & { password: string }>(User as any) })

        i.getInstance(StoreManager)
          .getStoreFor(User)
          .add({ username: 'user@example.com', roles: [] })

        const user = await i.getInstance(GoogleLoginSettings).getUserFromGooglePayload(
          {
            email: 'user@example.com',
            // eslint-disable-next-line @typescript-eslint/camelcase
            email_verified: true,
          } as any,
          i,
        )
        expect(user && user.roles).toEqual([])
      })
    })
  })

  describe('Service', () => {
    it('Can be constructed', () => {
      using(new Injector(), i => {
        expect(i.getInstance(GoogleLoginService)).toBeInstanceOf(GoogleLoginService)
      })
    })

    it('Should reject on invalide Google API responses', async () => {
      await usingAsync(new Injector(), async i => {
        i.setupStores(sm =>
          sm.addStore(new InMemoryStore({ model: User, primaryKey: 'username' })),
        ).useHttpAuthentication({
          getUserStore: sm => sm.getStoreFor<User & { password: string }>(User as any),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService['utils'].readPostBody = async () =>
          ({
            email: 'user@example.com',
            // eslint-disable-next-line @typescript-eslint/camelcase
            email_verified: false,
          } as any)
        i.getInstance(GoogleLoginSettings).get = ((_options: any, done: (...args: any[]) => any) => {
          done({
            statusCode: 404,
          })
        }) as any
        await expect(loginService.login('')).rejects.toThrow()
      })
    })

    it('Should reject if the user is not in the DB', async () => {
      await usingAsync(new Injector(), async i => {
        i.setupStores(sm =>
          sm.addStore(new InMemoryStore({ model: User, primaryKey: 'username' })),
        ).useHttpAuthentication({
          getUserStore: sm => sm.getStoreFor<User & { password: string }>(User as any),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService['utils'].readPostBody = async () =>
          ({
            email: 'user@example.com',
            // eslint-disable-next-line @typescript-eslint/camelcase
            email_verified: true,
          } as any)
        i.getInstance(GoogleLoginSettings).get = ((_options: any, done: (...args: any[]) => any) => {
          done({
            statusCode: 200,
          })
        }) as any
        await expect(loginService.login('')).rejects.toThrow()
      })
    })

    it('Should reject on unverified e-mail addresses', async () => {
      await usingAsync(new Injector(), async i => {
        i.setupStores(sm =>
          sm.addStore(new InMemoryStore({ model: User, primaryKey: 'username' })),
        ).useHttpAuthentication({
          getUserStore: sm => sm.getStoreFor<User & { password: string }>(User as any),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService['utils'].readPostBody = async () =>
          ({
            email: 'user@example.com',
            // eslint-disable-next-line @typescript-eslint/camelcase
            email_verified: false,
          } as any)
        i.getInstance(GoogleLoginSettings).get = ((_options: any, done: (...args: any[]) => any) => {
          done({
            statusCode: 200,
          })
        }) as any
        await expect(loginService.login('token')).rejects.toThrow()
      })
    })

    it('Should login the user on valid Google Payload response ', async () => {
      await usingAsync(new Injector(), async i => {
        i.setupStores(sm =>
          sm.addStore(new InMemoryStore({ model: User, primaryKey: 'username' })),
        ).useHttpAuthentication({ getUserStore: sm => sm.getStoreFor<User & { password: string }>(User as any) })

        const usr = await i
          .getInstance(StoreManager)
          .getStoreFor(User)
          .add({ username: 'user@example.com', roles: [] })

        const loginService = i.getInstance(GoogleLoginService)

        loginService['utils'].readPostBody = async () =>
          ({
            email: 'user@example.com',
            // eslint-disable-next-line @typescript-eslint/camelcase
            email_verified: true,
          } as any)
        i.getInstance(GoogleLoginSettings).get = ((_options: any, done: (...args: any[]) => any) => {
          done({
            statusCode: 200,
          })
        }) as any

        const user = await loginService.login('token')

        expect(user).toEqual(usr)
      })
    })
  })
})
