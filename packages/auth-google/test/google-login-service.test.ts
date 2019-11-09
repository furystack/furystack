import { usingAsync, using } from '@sensenet/client-utils'
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

    it('Skip parse the user from the Google Response post body if the email is not verified', async () => {
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
          } as any,
          i,
        )
        expect(user).toBeUndefined()
      })
    })
  })

  describe('Service', () => {
    it('Can be constructed', () => {
      using(new Injector(), i => {
        expect(i.getInstance(GoogleLoginService)).toBeInstanceOf(GoogleLoginService)
      })
    })
  })
})
