import type { User } from '@furystack/core'
import { InMemoryStore, User as UserModel, useSystemIdentityContext } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  UnauthenticatedError,
  usePasswordPolicy,
} from '@furystack/security'
import { DefaultSession, SessionStore, UserDataSet, UserStore, useHttpAuthentication } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useJwtAuthentication } from '../helpers.js'
import type { FingerprintCookieSettings, JwtAuthenticationSettings } from '../jwt-authentication-settings.js'
import { JwtTokenService } from '../jwt-token-service.js'
import { RefreshToken } from '../models/refresh-token.js'
import { RefreshTokenStore } from '../refresh-token-store.js'
import { createJwtAuthProvider } from './jwt-auth-provider.js'

const SECRET = 'a-very-secret-key-at-least-32-bytes-long!'
const FINGERPRINT_DISABLED: FingerprintCookieSettings = {
  enabled: false,
  name: 'fpt',
  sameSite: 'Strict',
  secure: true,
  path: '/',
}

const prepareInjector = (i: Injector, overrides?: Partial<JwtAuthenticationSettings>): void => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
  i.bind(RefreshTokenStore, () => new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i)
  useJwtAuthentication(i, { secret: SECRET, fingerprintCookie: FINGERPRINT_DISABLED, ...overrides })
}

describe('createJwtAuthProvider', () => {
  const testUser: User = { username: 'testuser', roles: ['admin'] }

  it('Should return null for requests without Bearer header', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
      const userDataSet = getDataSetFor(systemInjector, UserDataSet)
      const provider = createJwtAuthProvider({
        jwtTokenService: i.get(JwtTokenService),
        userDataSet,
        injector: systemInjector,
      })
      const result = await provider.authenticate({ headers: {} })
      expect(result).toBeNull()
    })
  })

  it('Should return null for requests with non-Bearer authorization', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
      const userDataSet = getDataSetFor(systemInjector, UserDataSet)
      const provider = createJwtAuthProvider({
        jwtTokenService: i.get(JwtTokenService),
        userDataSet,
        injector: systemInjector,
      })
      const result = await provider.authenticate({
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      })
      expect(result).toBeNull()
    })
  })

  it('Should return the user for a valid Bearer token', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      await i.get(UserStore).add(testUser)
      const tokenService = i.get(JwtTokenService)
      const { token } = tokenService.signAccessToken(testUser)
      const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
      const userDataSet = getDataSetFor(systemInjector, UserDataSet)
      const provider = createJwtAuthProvider({
        jwtTokenService: tokenService,
        userDataSet,
        injector: systemInjector,
      })
      const result = await provider.authenticate({
        headers: { authorization: `Bearer ${token}` },
      })
      expect(result).toEqual(testUser)
    })
  })

  it('Should throw UnauthenticatedError for invalid Bearer token', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
      const userDataSet = getDataSetFor(systemInjector, UserDataSet)
      const tokenService = i.get(JwtTokenService)
      const provider = createJwtAuthProvider({
        jwtTokenService: tokenService,
        userDataSet,
        injector: systemInjector,
      })
      await expect(
        provider.authenticate({
          headers: { authorization: 'Bearer invalid.token.here' },
        }),
      ).rejects.toThrow(UnauthenticatedError)
    })
  })

  it('Should throw UnauthenticatedError when user not found', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
      const userDataSet = getDataSetFor(systemInjector, UserDataSet)
      const tokenService = i.get(JwtTokenService)
      const { token } = tokenService.signAccessToken(testUser)
      const provider = createJwtAuthProvider({
        jwtTokenService: tokenService,
        userDataSet,
        injector: systemInjector,
      })
      await expect(
        provider.authenticate({
          headers: { authorization: `Bearer ${token}` },
        }),
      ).rejects.toThrow(UnauthenticatedError)
    })
  })

  describe('Fingerprint cookie protection', () => {
    const FINGERPRINT_ENABLED: FingerprintCookieSettings = {
      enabled: true,
      name: 'fpt',
      sameSite: 'Strict',
      secure: true,
      path: '/',
    }

    it('Should authenticate when fingerprint cookie matches', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { fingerprintCookie: FINGERPRINT_ENABLED })
        await i.get(UserStore).add(testUser)
        const tokenService = i.get(JwtTokenService)
        const { token, fingerprint } = tokenService.signAccessToken(testUser)
        const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
        const userDataSet = getDataSetFor(systemInjector, UserDataSet)
        const provider = createJwtAuthProvider({
          jwtTokenService: tokenService,
          userDataSet,
          injector: systemInjector,
          fingerprintCookieName: 'fpt',
        })
        const result = await provider.authenticate({
          headers: { authorization: `Bearer ${token}`, cookie: `fpt=${fingerprint}` },
        })
        expect(result).toEqual(testUser)
      })
    })

    it('Should reject when fingerprint cookie is missing', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { fingerprintCookie: FINGERPRINT_ENABLED })
        await i.get(UserStore).add(testUser)
        const tokenService = i.get(JwtTokenService)
        const { token } = tokenService.signAccessToken(testUser)
        const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
        const userDataSet = getDataSetFor(systemInjector, UserDataSet)
        const provider = createJwtAuthProvider({
          jwtTokenService: tokenService,
          userDataSet,
          injector: systemInjector,
          fingerprintCookieName: 'fpt',
        })
        await expect(
          provider.authenticate({
            headers: { authorization: `Bearer ${token}` },
          }),
        ).rejects.toThrow(UnauthenticatedError)
      })
    })

    it('Should reject when fingerprint cookie has wrong value', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { fingerprintCookie: FINGERPRINT_ENABLED })
        await i.get(UserStore).add(testUser)
        const tokenService = i.get(JwtTokenService)
        const { token } = tokenService.signAccessToken(testUser)
        const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
        const userDataSet = getDataSetFor(systemInjector, UserDataSet)
        const provider = createJwtAuthProvider({
          jwtTokenService: tokenService,
          userDataSet,
          injector: systemInjector,
          fingerprintCookieName: 'fpt',
        })
        await expect(
          provider.authenticate({
            headers: { authorization: `Bearer ${token}`, cookie: 'fpt=stolen-wrong-value' },
          }),
        ).rejects.toThrow(UnauthenticatedError)
      })
    })
  })
})
