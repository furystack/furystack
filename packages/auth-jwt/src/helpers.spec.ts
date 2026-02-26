import { InMemoryStore, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { PasswordCredential } from '@furystack/security'
import { useHttpAuthentication, HttpAuthenticationSettings } from '@furystack/rest-service'
import { DefaultSession } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useJwtAuthentication } from './helpers.js'
import { JwtAuthenticationSettings } from './jwt-authentication-settings.js'
import { RefreshToken } from './models/refresh-token.js'

const SECRET = 'a-very-secret-key-at-least-32-bytes-long!'

const prepareInjector = (i: Injector) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
    .addStore(new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))
  useHttpAuthentication(i)
}

describe('useJwtAuthentication', () => {
  it('Should register JwtAuthenticationSettings', async () => {
    await usingAsync(new Injector(), async (i) => {
      prepareInjector(i)
      useJwtAuthentication(i, { secret: SECRET })
      expect(i.cachedSingletons.get(JwtAuthenticationSettings)).toBeDefined()
    })
  })

  it('Should register a jwt-bearer provider', async () => {
    await usingAsync(new Injector(), async (i) => {
      prepareInjector(i)
      useJwtAuthentication(i, { secret: SECRET })
      const settings = i.getInstance(HttpAuthenticationSettings)
      const providerNames = settings.authenticationProviders.map((p) => p.name)
      expect(providerNames).toContain('jwt-bearer')
    })
  })

  it('Should throw on short secret', async () => {
    await usingAsync(new Injector(), async (i) => {
      prepareInjector(i)
      expect(() => useJwtAuthentication(i, { secret: 'short' })).toThrow(
        'JWT secret must be at least 32 bytes (256 bits) of entropy.',
      )
    })
  })

  it('Should accept custom settings', async () => {
    await usingAsync(new Injector(), async (i) => {
      prepareInjector(i)
      useJwtAuthentication(i, {
        secret: SECRET,
        accessTokenExpirationSeconds: 300,
        issuer: 'test-issuer',
      })
      const settings = i.getInstance(JwtAuthenticationSettings)
      expect(settings.accessTokenExpirationSeconds).toBe(300)
      expect(settings.issuer).toBe('test-issuer')
    })
  })
})
