import { InMemoryStore, User as UserModel } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import {
  DefaultSession,
  HttpAuthenticationSettings,
  SessionStore,
  UserStore,
  useHttpAuthentication,
} from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useJwtAuthentication } from './helpers.js'
import { JwtAuthenticationSettings } from './jwt-authentication-settings.js'
import { RefreshToken } from './models/refresh-token.js'
import { RefreshTokenStore } from './refresh-token-store.js'

const SECRET = 'a-very-secret-key-at-least-32-bytes-long!'

const prepareInjector = (i: Injector): void => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
  i.bind(RefreshTokenStore, () => new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i)
}

describe('useJwtAuthentication', () => {
  it('Should bind JwtAuthenticationSettings', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useJwtAuthentication(i, { secret: SECRET })
      const settings = i.get(JwtAuthenticationSettings)
      expect(settings).toBeDefined()
      expect(settings.secret).toBe(SECRET)
    })
  })

  it('Should register a jwt-bearer provider', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useJwtAuthentication(i, { secret: SECRET })
      const settings = i.get(HttpAuthenticationSettings)
      const providerNames = settings.authenticationProviders.map((p) => p.name)
      expect(providerNames).toContain('jwt-bearer')
    })
  })

  it('Should throw on short secret', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      expect(() => useJwtAuthentication(i, { secret: 'short' })).toThrow(
        'JWT secret must be at least 32 bytes (256 bits) of entropy.',
      )
    })
  })

  it('Should accept custom settings', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useJwtAuthentication(i, {
        secret: SECRET,
        accessTokenExpirationSeconds: 300,
        issuer: 'test-issuer',
      })
      const settings = i.get(JwtAuthenticationSettings)
      expect(settings.accessTokenExpirationSeconds).toBe(300)
      expect(settings.issuer).toBe('test-issuer')
    })
  })

  it('Should apply default settings for fields not provided', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useJwtAuthentication(i, { secret: SECRET })
      const settings = i.get(JwtAuthenticationSettings)
      expect(settings.accessTokenExpirationSeconds).toBe(900)
      expect(settings.refreshTokenExpirationSeconds).toBe(604800)
      expect(settings.clockSkewToleranceSeconds).toBe(5)
      expect(settings.refreshTokenRotationGracePeriodSeconds).toBe(30)
      expect(settings.fingerprintCookie.enabled).toBe(true)
      expect(settings.fingerprintCookie.name).toBe('fpt')
    })
  })

  it('Should merge fingerprintCookie overrides with the defaults', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      useJwtAuthentication(i, {
        secret: SECRET,
        fingerprintCookie: { enabled: false },
      })
      const settings = i.get(JwtAuthenticationSettings)
      expect(settings.fingerprintCookie.enabled).toBe(false)
      expect(settings.fingerprintCookie.name).toBe('fpt')
      expect(settings.fingerprintCookie.path).toBe('/')
    })
  })

  it('Should throw when JwtAuthenticationSettings is resolved without useJwtAuthentication', async () => {
    await usingAsync(createInjector(), async (i) => {
      expect(() => i.get(JwtAuthenticationSettings)).toThrow('JwtAuthenticationSettings has not been configured')
    })
  })
})
