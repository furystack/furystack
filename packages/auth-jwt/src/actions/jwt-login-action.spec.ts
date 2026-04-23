import { InMemoryStore, User as UserModel } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import { DefaultSession, SessionStore, UserStore, useHttpAuthentication } from '@furystack/rest-service'
import {
  PasswordAuthenticator,
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it } from 'vitest'

import { useJwtAuthentication } from '../helpers.js'
import { RefreshToken } from '../models/refresh-token.js'
import { RefreshTokenStore } from '../refresh-token-store.js'
import { createJwtLoginAction } from './jwt-login-action.js'

const SECRET = 'test-secret-that-is-at-least-32-bytes-long!'

const setupInjector = async (i: Injector, username: string, password: string) => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
  i.bind(RefreshTokenStore, () => new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i)
  useJwtAuthentication(i, { secret: SECRET })

  const pw = i.get(PasswordAuthenticator)
  const cred = await pw.hasher.createCredential(username, password)
  await i.get(PasswordCredentialStore).add(cred)
  await i.get(UserStore).add({ username, roles: ['admin'] })
}

describe('createJwtLoginAction', () => {
  const request = {} as IncomingMessage
  const response = {} as ServerResponse

  it('Should return accessToken and refreshToken on valid credentials', async () => {
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const action = createJwtLoginAction(i)
      const result = await action({
        injector: i,
        request,
        response,
        getBody: () => Promise.resolve({ username: 'testuser', password: 'testpass' }),
      })
      expect(result.chunk.accessToken).toBeTruthy()
      expect(result.chunk.refreshToken).toBeTruthy()
      expect(result.statusCode).toBe(200)
    })
  })

  it('Should return valid JWT access tokens', async () => {
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const action = createJwtLoginAction(i)
      const result = await action({
        injector: i,
        request,
        response,
        getBody: () => Promise.resolve({ username: 'testuser', password: 'testpass' }),
      })
      expect(result.chunk.accessToken.split('.')).toHaveLength(3)
    })
  })

  it('Should throw RequestError on invalid credentials', async () => {
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const action = createJwtLoginAction(i)
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
    await usingAsync(createInjector(), async (i) => {
      await setupInjector(i, 'testuser', 'testpass')
      const action = createJwtLoginAction(i)
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
})
