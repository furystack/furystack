import { InMemoryStore, User } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { HttpAuthenticationSettings } from './http-authentication-settings'
import './injector-extensions'
import { DefaultSession } from './models'

describe('HttpAuthenticationSettings', () => {
  it('Should report healthy status when everything is OK', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setupStores((sm) =>
        sm
          .addStore(
            new InMemoryStore({
              model: User,
              primaryKey: 'username',
            }),
          )
          .addStore(
            new InMemoryStore({
              model: DefaultSession,
              primaryKey: 'sessionId',
            }),
          ),
      )
      injector.useHttpAuthentication()
      const result = await injector.getInstance(HttpAuthenticationSettings).checkHealth()
      expect(result).toEqual({ healthy: 'healthy' })
    })
  })

  it('Should report unhealthy status when user store is not set', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setupStores((sm) =>
        sm.addStore(
          new InMemoryStore({
            model: DefaultSession,
            primaryKey: 'sessionId',
          }),
        ),
      )
      injector.useHttpAuthentication()
      const result = await injector.getInstance(HttpAuthenticationSettings).checkHealth()
      expect(result).toEqual({
        healthy: 'unhealthy',
        reason: { message: 'Failed to get user store', error: Error("Store not found for 'User'") },
      })
    })
  })

  it('Should report unhealthy status when session store is not set', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setupStores((sm) =>
        sm.addStore(
          new InMemoryStore({
            model: User,
            primaryKey: 'username',
          }),
        ),
      )
      injector.useHttpAuthentication()
      const result = await injector.getInstance(HttpAuthenticationSettings).checkHealth()
      expect(result).toEqual({
        healthy: 'unhealthy',
        reason: { message: 'Failed to get session store', error: Error("Store not found for 'DefaultSession'") },
      })
    })
  })
})
