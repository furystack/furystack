import { InMemoryStore, User as UserModel } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import { DefaultSession, SessionStore, UserStore, useHttpAuthentication } from '@furystack/rest-service'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { TokenPayload } from 'google-auth-library'
import { describe, expect, it, vi } from 'vitest'

import { GoogleAuthenticationSettings } from './google-authentication-settings.js'
import { useGoogleAuthentication } from './helpers.js'
import { GoogleLoginService } from './login-service.js'

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

const prepareInjector = (i: Injector): void => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i)
}

describe('useGoogleAuthentication', () => {
  it('Should bind GoogleAuthenticationSettings with the provided clientId', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })
      const settings = i.get(GoogleAuthenticationSettings)
      expect(settings.clientId).toBe(CLIENT_ID)
    })
  })

  it('Should expose clientId on the resolved service', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })
      const service = i.get(GoogleLoginService)
      expect(service.clientId).toBe(CLIENT_ID)
    })
  })

  it('Should throw if clientId is empty', async () => {
    await usingAsync(createInjector(), async (i) => {
      expect(() => useGoogleAuthentication(i, { clientId: '' })).toThrow('Google clientId is required.')
    })
  })

  it('Should throw when GoogleAuthenticationSettings is resolved without useGoogleAuthentication', async () => {
    await usingAsync(createInjector(), async (i) => {
      expect(() => i.get(GoogleAuthenticationSettings)).toThrow('GoogleAuthenticationSettings has not been configured')
    })
  })
})

describe('GoogleLoginService', () => {
  it('Should resolve user from Google payload when email is verified', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      await i.get(UserStore).add({ username: 'user@example.com', roles: [] })

      const user = await i.get(GoogleLoginService).getUserFromGooglePayload(createTokenPayload())
      expect(user?.username).toBe('user@example.com')
    })
  })

  it('Should reject when email is not verified', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      await expect(
        i.get(GoogleLoginService).getUserFromGooglePayload(createTokenPayload({ email_verified: false })),
      ).rejects.toThrow('Google email is not verified.')
    })
  })

  it('Should reject when email is missing from payload', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      await expect(
        i
          .get(GoogleLoginService)
          .getUserFromGooglePayload(createTokenPayload({ email: undefined, email_verified: true })),
      ).rejects.toThrow('Google token does not contain an email address.')
    })
  })

  it('Should return undefined when user is not in the database', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      const user = await i.get(GoogleLoginService).getUserFromGooglePayload(createTokenPayload())
      expect(user).toBeUndefined()
    })
  })

  it('Should verify the token and return the payload', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      const payload = createTokenPayload()
      mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => payload })

      const result = await i.get(GoogleLoginService).getGoogleUserData('valid-token')
      expect(result.email).toBe('user@example.com')
    })
  })

  it('Should reject when verifyIdToken fails', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      mockVerifyIdToken.mockRejectedValueOnce(new Error('Token verification failed'))

      await expect(i.get(GoogleLoginService).getGoogleUserData('invalid-token')).rejects.toThrow(
        'Token verification failed',
      )
    })
  })

  it('Should reject when payload is empty', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useGoogleAuthentication(i, { clientId: CLIENT_ID })

      mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => undefined })

      await expect(i.get(GoogleLoginService).getGoogleUserData('token')).rejects.toThrow(
        'Failed to get payload from Google ID token.',
      )
    })
  })

  it('Should honour a caller-supplied getUserFromGooglePayload override', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      const override = vi.fn(async () => ({ username: 'custom@example.com', roles: ['override'] }))
      useGoogleAuthentication(i, { clientId: CLIENT_ID, getUserFromGooglePayload: override })

      const user = await i.get(GoogleLoginService).getUserFromGooglePayload(createTokenPayload())
      expect(override).toHaveBeenCalled()
      expect(user?.username).toBe('custom@example.com')
    })
  })
})
