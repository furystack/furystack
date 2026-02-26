import { InMemoryStore, StoreManager, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { DefaultSession, useHttpAuthentication } from '@furystack/rest-service'
import { PasswordAuthenticator, PasswordCredential, PasswordResetToken, usePasswordPolicy } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it } from 'vitest'

import { useJwtAuthentication } from '../helpers.js'
import { RefreshToken } from '../models/refresh-token.js'
import { createJwtLoginAction } from './jwt-login-action.js'

const SECRET = 'test-secret-that-is-at-least-32-bytes-long!'

const setupInjector = async (i: Injector, username: string, password: string) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
    .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
    .addStore(new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))

  const repo = getRepository(i)
  repo.createDataSet(User, 'username')
  repo.createDataSet(DefaultSession, 'sessionId')
  repo.createDataSet(PasswordCredential, 'userName')
  repo.createDataSet(PasswordResetToken, 'token')
  repo.createDataSet(RefreshToken, 'token')

  usePasswordPolicy(i)
  useHttpAuthentication(i)
  useJwtAuthentication(i, { secret: SECRET })

  const sm = i.getInstance(StoreManager)
  const pw = i.getInstance(PasswordAuthenticator)
  const cred = await pw.hasher.createCredential(username, password)
  await sm.getStoreFor(PasswordCredential, 'userName').add(cred)
  await sm.getStoreFor(User, 'username').add({ username, roles: ['admin'] })
}

describe('createJwtLoginAction', () => {
  const request = {} as IncomingMessage
  const response = {} as ServerResponse

  it('Should return accessToken and refreshToken on valid credentials', async () => {
    await usingAsync(new Injector(), async (i) => {
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
    await usingAsync(new Injector(), async (i) => {
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
    await usingAsync(new Injector(), async (i) => {
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
    await usingAsync(new Injector(), async (i) => {
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
