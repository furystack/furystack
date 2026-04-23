import type { User } from '@furystack/core'
import { InMemoryStore, User as UserModel } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { useHttpAuthentication } from '../helpers.js'
import type { LoginResponseStrategy } from '../login-response-strategy.js'
import { DefaultSession } from '../models/default-session.js'
import { JsonResult } from '../request-action-implementation.js'
import { SessionStore, UserStore } from '../user-store.js'
import { PasswordAuthenticator } from '@furystack/security'
import { createPasswordLoginAction } from './password-login-action.js'

const setupInjector = async (i: Injector, username: string, password: string) => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i)

  const authenticator = i.get(PasswordAuthenticator)
  const cred = await authenticator.hasher.createCredential(username, password)
  await i.get(PasswordCredentialStore).add(cred)
  await i.get(UserStore).add({ username, roles: ['admin'] })
}

const mockStrategy: LoginResponseStrategy<User> = {
  createLoginResponse: vi.fn(async (user: User) => JsonResult(user, 200)),
}

describe('createPasswordLoginAction', () => {
  const request = {} as IncomingMessage
  const response = {} as ServerResponse

  it('delegates to the strategy on successful authentication', async () => {
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const action = createPasswordLoginAction(mockStrategy)
      const result = await action({
        injector: i,
        request,
        response,
        getBody: () => Promise.resolve({ username: 'testuser', password: 'testpass' }),
      })
      expect(mockStrategy.createLoginResponse).toHaveBeenCalled()
      expect(result.chunk.username).toBe('testuser')
    })
  })

  it('passes the authenticated user to the strategy', async () => {
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const strategyFn = vi.fn(async (user: User) => JsonResult(user, 200))
      const strategy: LoginResponseStrategy<User> = { createLoginResponse: strategyFn }
      const action = createPasswordLoginAction(strategy)
      await action({
        injector: i,
        request,
        response,
        getBody: () => Promise.resolve({ username: 'testuser', password: 'testpass' }),
      })
      expect(strategyFn).toHaveBeenCalledWith(expect.objectContaining({ username: 'testuser', roles: ['admin'] }), i)
    })
  })

  it('throws RequestError on invalid password', async () => {
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const action = createPasswordLoginAction(mockStrategy)
      await expect(
        action({
          injector: i,
          request,
          response,
          getBody: () => Promise.resolve({ username: 'testuser', password: 'wrongpass' }),
        }),
      ).rejects.toThrow('Login Failed')
    })
  })

  it('throws RequestError for an unknown user', async () => {
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const action = createPasswordLoginAction(mockStrategy)
      await expect(
        action({
          injector: i,
          request,
          response,
          getBody: () => Promise.resolve({ username: 'nobody', password: 'nopass' }),
        }),
      ).rejects.toThrow('Login Failed')
    })
  })

  it('supports strategies returning custom result shapes', async () => {
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const tokenStrategy: LoginResponseStrategy<{ accessToken: string }> = {
        createLoginResponse: async () => JsonResult({ accessToken: 'tok123' }, 200),
      }
      const action = createPasswordLoginAction(tokenStrategy)
      const result = await action({
        injector: i,
        request,
        response,
        getBody: () => Promise.resolve({ username: 'testuser', password: 'testpass' }),
      })
      expect(result.chunk.accessToken).toBe('tok123')
    })
  })
})
