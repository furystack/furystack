import { InMemoryStore, StoreManager, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { PasswordAuthenticator, PasswordCredential, PasswordResetToken, usePasswordPolicy } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'

import { useHttpAuthentication } from '../helpers.js'
import type { LoginResponseStrategy } from '../login-response-strategy.js'
import { DefaultSession } from '../models/default-session.js'
import { JsonResult } from '../request-action-implementation.js'
import { createPasswordLoginAction } from './password-login-action.js'

const setupInjector = async (i: Injector, username: string, password: string) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
    .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  const repo = getRepository(i)
  repo.createDataSet(User, 'username')
  repo.createDataSet(DefaultSession, 'sessionId')
  repo.createDataSet(PasswordCredential, 'userName')
  repo.createDataSet(PasswordResetToken, 'token')

  usePasswordPolicy(i)
  useHttpAuthentication(i)

  const sm = i.getInstance(StoreManager)
  const pw = i.getInstance(PasswordAuthenticator)
  const cred = await pw.hasher.createCredential(username, password)
  await sm.getStoreFor(PasswordCredential, 'userName').add(cred)
  await sm.getStoreFor(User, 'username').add({ username, roles: ['admin'] })
}

const mockStrategy: LoginResponseStrategy<User> = {
  createLoginResponse: vi.fn(async (user: User) => JsonResult(user, 200)),
}

describe('createPasswordLoginAction', () => {
  const request = {} as IncomingMessage
  const response = {} as ServerResponse

  it('Should delegate to the strategy on successful authentication', async () => {
    await usingAsync(new Injector(), async (i) => {
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

  it('Should pass the correct user to the strategy', async () => {
    await usingAsync(new Injector(), async (i) => {
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

  it('Should throw RequestError on invalid credentials', async () => {
    await usingAsync(new Injector(), async (i) => {
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

  it('Should throw RequestError for nonexistent user', async () => {
    await usingAsync(new Injector(), async (i) => {
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

  it('Should work with a custom result type from strategy', async () => {
    await usingAsync(new Injector(), async (i) => {
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
