import { InMemoryStore, StoreManager, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { DefaultSession, useHttpAuthentication } from '@furystack/rest-service'
import { PasswordCredential, PasswordResetToken, usePasswordPolicy } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { TokenPayload } from 'google-auth-library'
import { describe, expect, it, vi } from 'vitest'

import { useGoogleAuthentication } from './helpers.js'
import { GoogleLoginService, GoogleLoginSettings } from './login-service.js'

const mockVerifyIdToken = vi.fn()

vi.mock('google-auth-library', () => ({
  OAuth2Client: class MockOAuth2Client {
    verifyIdToken = mockVerifyIdToken
  },
}))

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com'

const createTokenPayload = (overrides?: Partial<TokenPayload>): TokenPayload =>
  ({
    iss: 'accounts.google.com',
    sub: '1234567890',
    aud: CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    email: 'user@example.com',
    email_verified: true,
    name: 'Test User',
    picture: 'https://example.com/photo.jpg',
    given_name: 'Test',
    family_name: 'User',
    ...overrides,
  }) as TokenPayload

const setupStores = (i: Injector) => {
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
}

describe('useGoogleAuthentication', () => {
  it('Should register GoogleLoginSettings with the provided clientId', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })
      const settings = i.getInstance(GoogleLoginSettings)
      expect(settings.clientId).toBe(CLIENT_ID)
    })
  })

  it('Should throw if clientId is empty', () => {
    const i = new Injector()
    expect(() => useGoogleAuthentication(i, { clientId: '' })).toThrow('Google clientId is required.')
  })
})

describe('GoogleLoginSettings', () => {
  it('Should resolve user from Google payload when email is verified', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      await i.getInstance(StoreManager).getStoreFor(User, 'username').add({ username: 'user@example.com', roles: [] })

      const user = await i.getInstance(GoogleLoginSettings).getUserFromGooglePayload(createTokenPayload())
      expect(user?.username).toBe('user@example.com')
    })
  })

  it('Should reject when email is not verified', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      await expect(
        i.getInstance(GoogleLoginSettings).getUserFromGooglePayload(createTokenPayload({ email_verified: false })),
      ).rejects.toThrow('Google email is not verified.')
    })
  })

  it('Should return undefined when user is not in the database', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      const user = await i.getInstance(GoogleLoginSettings).getUserFromGooglePayload(createTokenPayload())
      expect(user).toBeUndefined()
    })
  })
})

describe('GoogleLoginService', () => {
  it('Can be constructed', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(i.getInstance(GoogleLoginService)).toBeInstanceOf(GoogleLoginService)
    })
  })

  it('Should verify the token and return the user on valid payload', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      const usr = { username: 'user@example.com', roles: [] }
      await i.getInstance(StoreManager).getStoreFor(User, 'username').add(usr)

      const payload = createTokenPayload()
      mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => payload })

      const user = await i.getInstance(GoogleLoginService).login('valid-token')
      expect(user).toEqual(usr)
    })
  })

  it('Should reject when verifyIdToken fails', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      mockVerifyIdToken.mockRejectedValueOnce(new Error('Token verification failed'))

      await expect(i.getInstance(GoogleLoginService).login('invalid-token')).rejects.toThrow(
        'Token verification failed',
      )
    })
  })

  it('Should reject when payload is empty', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => undefined })

      await expect(i.getInstance(GoogleLoginService).login('token')).rejects.toThrow(
        'Failed to get payload from Google ID token.',
      )
    })
  })

  it('Should reject when user is not in the database', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      const payload = createTokenPayload()
      mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => payload })

      await expect(i.getInstance(GoogleLoginService).login('token')).rejects.toThrow('Attached user not found.')
    })
  })

  it('Should reject on unverified email addresses', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupStores(i)
      useHttpAuthentication(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      const payload = createTokenPayload({ email_verified: false })
      mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => payload })

      await expect(i.getInstance(GoogleLoginService).login('token')).rejects.toThrow('Google email is not verified.')
    })
  })
})
