import { InMemoryStore, StoreManager, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { useHttpAuthentication } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import type { get } from 'http'
import { describe, expect, it } from 'vitest'
import type { GoogleApiPayload } from './login-service.js'
import { GoogleLoginService, GoogleLoginSettings } from './login-service.js'

const getGoogleUser = (overrides?: Partial<GoogleApiPayload>) =>
  ({
    email: 'user@example.com',
    email_verified: true,
    ...overrides,
  }) as GoogleApiPayload

describe('Google Login Service', () => {
  describe('Settings', () => {
    it('Can parse the user from the Google Response post body', async () => {
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor(User, 'username'),
        })

        await i.getInstance(StoreManager).getStoreFor(User, 'username').add({ username: 'user@example.com', roles: [] })

        const user = await i.getInstance(GoogleLoginSettings).getUserFromGooglePayload(getGoogleUser())
        expect(user && user.roles).toEqual([])
      })
    })
  })

  describe('Service', () => {
    it('Can be constructed', async () => {
      await usingAsync(new Injector(), async (i) => {
        expect(i.getInstance(GoogleLoginService)).toBeInstanceOf(GoogleLoginService)
      })
    })

    it('Should reject on invalide Google API responses', async () => {
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))

        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor(User, 'username'),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService.readPostBody = async <T>() =>
          getGoogleUser({
            email_verified: false,
          }) as T
        i.getInstance(GoogleLoginSettings).get = ((_options: unknown, done: (...args: unknown[]) => unknown) => {
          done({
            statusCode: 404,
          })
        }) as GoogleLoginSettings['get']
        await expect(loginService.login('')).rejects.toThrow()
      })
    })

    it('Should reject if the user is not in the DB', async () => {
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor(User, 'username'),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService.readPostBody = async <T>() => getGoogleUser() as T
        i.getInstance(GoogleLoginSettings).get = ((_options: unknown, done: (...args: unknown[]) => unknown) => {
          done({
            statusCode: 200,
          })
        }) as typeof get
        await expect(loginService.login('')).rejects.toThrow()
      })
    })

    it('Should reject on unverified e-mail addresses', async () => {
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor(User, 'username'),
        })
        const loginService = i.getInstance(GoogleLoginService)
        loginService.readPostBody = <T>() =>
          getGoogleUser({
            email_verified: false,
          }) as T
        i.getInstance(GoogleLoginSettings).get = ((_options: any, done: (...args: any[]) => any) => {
          done({
            statusCode: 200,
          })
        }) as typeof get
        await expect(loginService.login('token')).rejects.toThrow()
      })
    })

    it('Should login the user on valid Google Payload response ', async () => {
      await usingAsync(new Injector(), async (i) => {
        addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
        useHttpAuthentication(i, {
          getUserStore: (sm) => sm.getStoreFor(User, 'username'),
        })

        const usr = { username: 'user@example.com', roles: [] }
        await i.getInstance(StoreManager).getStoreFor(User, 'username').add(usr)

        const loginService = i.getInstance(GoogleLoginService)

        loginService.readPostBody = async <T>() =>
          ({
            email: 'user@example.com',
            email_verified: true,
          }) as T
        i.getInstance(GoogleLoginSettings).get = ((_options: any, done: (...args: any[]) => any) => {
          done({
            statusCode: 200,
          })
        }) as typeof get

        const user = await loginService.login('token')

        expect(user).toEqual(usr)
      })
    })
  })
})
