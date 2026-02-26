import { InMemoryStore, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { DefaultSession, useHttpAuthentication } from '@furystack/rest-service'
import { PasswordCredential, PasswordResetToken, usePasswordPolicy } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'

import type { FingerprintCookieSettings } from './jwt-authentication-settings.js'
import { createJwtLoginStrategy } from './jwt-login-response-strategy.js'
import { useJwtAuthentication } from './helpers.js'
import { RefreshToken } from './models/refresh-token.js'

const SECRET = 'test-secret-that-is-at-least-32-bytes-long!'

const FINGERPRINT_DISABLED: FingerprintCookieSettings = {
  enabled: false,
  name: 'fpt',
  sameSite: 'Strict',
  secure: true,
  path: '/',
}

const FINGERPRINT_ENABLED: FingerprintCookieSettings = {
  enabled: true,
  name: 'fpt',
  sameSite: 'Strict',
  secure: false,
  path: '/',
}

const setupInjector = (i: Injector, fingerprintCookie: FingerprintCookieSettings = FINGERPRINT_DISABLED) => {
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
  useJwtAuthentication(i, { secret: SECRET, fingerprintCookie })
}

describe('createJwtLoginStrategy', () => {
  const testUser: User = { username: 'testuser', roles: ['admin'] }

  it('Should return accessToken and refreshToken in the response body', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createJwtLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      expect(result.chunk.accessToken).toBeTruthy()
      expect(result.chunk.refreshToken).toBeTruthy()
    })
  })

  it('Should return status code 200', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createJwtLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      expect(result.statusCode).toBe(200)
    })
  })

  it('Should return a valid JWT access token with 3 parts', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createJwtLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      expect(result.chunk.accessToken.split('.')).toHaveLength(3)
    })
  })

  it('Should persist the refresh token in the DataSet', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createJwtLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)

      const repo = getRepository(i)
      const refreshTokenDataSet = repo.getDataSetFor(RefreshToken, 'token')
      const tokens = await refreshTokenDataSet.find(i, { filter: { token: { $eq: result.chunk.refreshToken } } })
      expect(tokens).toHaveLength(1)
      expect(tokens[0].username).toBe('testuser')
    })
  })

  it('Should include fingerprint cookie header when fingerprinting is enabled', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i, FINGERPRINT_ENABLED)
      const strategy = createJwtLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      const setCookie = result.headers['Set-Cookie']
      expect(setCookie).toBeDefined()
      expect(setCookie).toContain('fpt=')
    })
  })

  it('Should not include fingerprint cookie header when fingerprinting is disabled', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i, FINGERPRINT_DISABLED)
      const strategy = createJwtLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      const setCookie = result.headers['Set-Cookie']
      expect(setCookie).toBeUndefined()
    })
  })

  it('Should generate unique refresh tokens for each call', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const strategy = createJwtLoginStrategy(i)
      const result1 = await strategy.createLoginResponse(testUser, i)
      const result2 = await strategy.createLoginResponse(testUser, i)
      expect(result1.chunk.refreshToken).not.toBe(result2.chunk.refreshToken)
    })
  })
})
