import { usingAsync, using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { InMemoryStore, User, StoreManager, addStore } from '@furystack/core'
import { GoogleLoginSettings, GoogleLoginService } from './login-service'
import { useHttpAuthentication } from '@furystack/rest-service'

describe('Google Login Service', () => {
  describe('Settings', () => {
    it('Can parse the user from the Google Response post body', async () => {
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
        })

        i.getInstance(StoreManager).getStoreFor(User, 'username').add({ username: 'user@example.com', roles: [] })

        const user = await i.getInstance(GoogleLoginSettings).getUserFromGooglePayload(
          {
            email: 'user@example.com',
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
      using(new Injector(), (i) => {
        expect(i.getInstance(GoogleLoginService)).toBeInstanceOf(GoogleLoginService)
      })
    })

    it('Should reject on invalide Google API responses', async () => {
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))

        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService.utils.readPostBody = async () =>
          ({
            email: 'user@example.com',
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
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService.utils.readPostBody = async () =>
          ({
            email: 'user@example.com',
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
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService.utils.readPostBody = async () =>
          ({
            email: 'user@example.com',
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
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
        })

        const usr = { username: 'user@example.com', roles: [] }
        await i.getInstance(StoreManager).getStoreFor(User, 'username').add(usr)

        const loginService = i.getInstance(GoogleLoginService)

        loginService.utils.readPostBody = async () =>
          ({
            email: 'user@example.com',
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
