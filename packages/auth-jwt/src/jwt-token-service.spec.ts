import type { User } from '@furystack/core'
import { InMemoryStore, User as UserModel } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  UnauthenticatedError,
  usePasswordPolicy,
} from '@furystack/security'
import { DefaultSession, SessionStore, UserStore, useHttpAuthentication } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useJwtAuthentication } from './helpers.js'
import type { FingerprintCookieSettings, JwtAuthenticationSettings } from './jwt-authentication-settings.js'
import { JwtTokenService } from './jwt-token-service.js'
import { base64UrlEncode, decodeJwt, hashFingerprint, signHs256 } from './jwt-utils.js'
import { RefreshToken } from './models/refresh-token.js'
import { RefreshTokenStore } from './refresh-token-store.js'

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
  useJwtAuthentication(i, { secret: SECRET, ...overrides })
}

describe('JwtTokenService', () => {
  const testUser: User = { username: 'testuser', roles: ['admin', 'user'] }

  describe('signAccessToken / verifyAccessToken', () => {
    it('Should sign and verify an access token', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const { token, fingerprint } = service.signAccessToken(testUser)
        const payload = service.verifyAccessToken(token, fingerprint)
        expect(payload.sub).toBe('testuser')
        expect(payload.roles).toEqual(['admin', 'user'])
        expect(payload.exp).toBeGreaterThan(payload.iat)
      })
    })

    it('Should include issuer and audience when configured', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { issuer: 'my-app', audience: 'my-client' })
        const service = i.get(JwtTokenService)
        const { token, fingerprint } = service.signAccessToken(testUser)
        const payload = service.verifyAccessToken(token, fingerprint)
        expect(payload.iss).toBe('my-app')
        expect(payload.aud).toBe('my-client')
      })
    })

    it('Should reject a token with wrong issuer', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { issuer: 'correct-issuer', fingerprintCookie: FINGERPRINT_DISABLED })
        const service = i.get(JwtTokenService)

        const now = Math.floor(Date.now() / 1000)
        const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = base64UrlEncode(
          JSON.stringify({ sub: 'testuser', roles: [], iat: now, exp: now + 900, iss: 'wrong-issuer' }),
        )
        const sig = signHs256(`${header}.${payload}`, SECRET)
        const token = `${header}.${payload}.${sig}`

        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject a token with wrong audience', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { audience: 'correct-audience', fingerprintCookie: FINGERPRINT_DISABLED })
        const service = i.get(JwtTokenService)

        const now = Math.floor(Date.now() / 1000)
        const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = base64UrlEncode(
          JSON.stringify({ sub: 'testuser', roles: [], iat: now, exp: now + 900, aud: 'wrong-audience' }),
        )
        const sig = signHs256(`${header}.${payload}`, SECRET)
        const token = `${header}.${payload}.${sig}`

        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject an expired token', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { clockSkewToleranceSeconds: 0, fingerprintCookie: FINGERPRINT_DISABLED })
        const service = i.get(JwtTokenService)

        const now = Math.floor(Date.now() / 1000)
        const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = base64UrlEncode(JSON.stringify({ sub: 'testuser', roles: [], iat: now - 1000, exp: now - 100 }))
        const sig = signHs256(`${header}.${payload}`, SECRET)
        const token = `${header}.${payload}.${sig}`

        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject a token with alg: none', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)

        const now = Math.floor(Date.now() / 1000)
        const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }))
        const payload = base64UrlEncode(JSON.stringify({ sub: 'testuser', roles: [], iat: now, exp: now + 900 }))
        const token = `${header}.${payload}.`

        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject a token with wrong alg (RS256)', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)

        const now = Math.floor(Date.now() / 1000)
        const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
        const payload = base64UrlEncode(JSON.stringify({ sub: 'testuser', roles: [], iat: now, exp: now + 900 }))
        const sig = signHs256(`${header}.${payload}`, SECRET)
        const token = `${header}.${payload}.${sig}`

        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject a tampered token', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const { token } = service.signAccessToken(testUser)
        const parts = token.split('.')
        const tamperedPayload = base64UrlEncode(
          JSON.stringify({ sub: 'hacker', roles: ['admin'], iat: 0, exp: 99999999999 }),
        )
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`

        expect(() => service.verifyAccessToken(tamperedToken)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject an invalid format token', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        expect(() => service.verifyAccessToken('not-a-jwt')).toThrow(UnauthenticatedError)
        expect(() => service.verifyAccessToken('')).toThrow(UnauthenticatedError)
      })
    })
  })

  describe('Fingerprint cookie protection', () => {
    it('Should embed fpt claim in the access token when enabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const { token, fingerprint } = service.signAccessToken(testUser)
        expect(fingerprint).toBeTruthy()
        const decoded = decodeJwt(token)
        expect(decoded.payload.fpt).toBe(hashFingerprint(fingerprint!))
      })
    })

    it('Should not embed fpt claim when fingerprinting is disabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { fingerprintCookie: FINGERPRINT_DISABLED })
        const service = i.get(JwtTokenService)
        const { token, fingerprint } = service.signAccessToken(testUser)
        expect(fingerprint).toBeNull()
        const decoded = decodeJwt(token)
        expect(decoded.payload.fpt).toBeUndefined()
      })
    })

    it('Should verify successfully with the correct fingerprint', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const { token, fingerprint } = service.signAccessToken(testUser)
        expect(() => service.verifyAccessToken(token, fingerprint)).not.toThrow()
      })
    })

    it('Should reject a token with a wrong fingerprint', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const { token } = service.signAccessToken(testUser)
        expect(() => service.verifyAccessToken(token, 'wrong-fingerprint-value')).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject a token with a missing fingerprint when enabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const { token } = service.signAccessToken(testUser)
        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
        expect(() => service.verifyAccessToken(token, null)).toThrow(UnauthenticatedError)
      })
    })

    it('Should skip fingerprint check when disabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { fingerprintCookie: FINGERPRINT_DISABLED })
        const service = i.get(JwtTokenService)
        const { token } = service.signAccessToken(testUser)
        expect(() => service.verifyAccessToken(token)).not.toThrow()
      })
    })
  })

  describe('signRefreshToken / verifyRefreshToken', () => {
    it('Should sign and verify a refresh token', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const token = await service.signRefreshToken(testUser)
        expect(typeof token).toBe('string')
        expect(token.length).toBe(64)
        const result = await service.verifyRefreshToken(token)
        expect(result.username).toBe('testuser')
        expect(result.replacedByToken).toBeUndefined()
      })
    })

    it('Should reject a non-existent refresh token', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        await expect(service.verifyRefreshToken('nonexistent')).rejects.toThrow(UnauthenticatedError)
      })
    })

    it('Should reject an expired refresh token', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { refreshTokenExpirationSeconds: -1 })
        const service = i.get(JwtTokenService)
        const token = await service.signRefreshToken(testUser)
        await expect(service.verifyRefreshToken(token)).rejects.toThrow(UnauthenticatedError)
      })
    })
  })

  describe('Token rotation with grace period', () => {
    it('Should accept a rotated token within grace period and return replacement', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { refreshTokenRotationGracePeriodSeconds: 60 })
        const service = i.get(JwtTokenService)
        const oldToken = await service.signRefreshToken(testUser)
        const newToken = await service.signRefreshToken(testUser)
        await service.rotateRefreshToken(oldToken, newToken)

        const result = await service.verifyRefreshToken(oldToken)
        expect(result.username).toBe('testuser')
        expect(result.replacedByToken).toBe(newToken)
      })
    })

    it('Should reject a rotated token beyond grace period', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { refreshTokenRotationGracePeriodSeconds: 0 })
        const service = i.get(JwtTokenService)
        const oldToken = await service.signRefreshToken(testUser)
        const newToken = await service.signRefreshToken(testUser)

        const store = i.get(RefreshTokenStore)
        await store.update(oldToken, {
          revokedAt: new Date(Date.now() - 10000).toISOString(),
          replacedByToken: newToken,
        })

        await expect(service.verifyRefreshToken(oldToken)).rejects.toThrow(UnauthenticatedError)
      })
    })
  })

  describe('revokeRefreshToken', () => {
    it('Should remove the token from the store', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const token = await service.signRefreshToken(testUser)
        await service.revokeRefreshToken(token)
        await expect(service.verifyRefreshToken(token)).rejects.toThrow(UnauthenticatedError)
      })
    })

    it('Should not throw for a non-existent token', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        await expect(service.revokeRefreshToken('nonexistent')).resolves.not.toThrow()
      })
    })
  })

  describe('revokeAllRefreshTokensForUser', () => {
    it('Should remove all tokens for a user', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const service = i.get(JwtTokenService)
        const token1 = await service.signRefreshToken(testUser)
        const token2 = await service.signRefreshToken(testUser)
        await service.revokeAllRefreshTokensForUser('testuser')
        await expect(service.verifyRefreshToken(token1)).rejects.toThrow(UnauthenticatedError)
        await expect(service.verifyRefreshToken(token2)).rejects.toThrow(UnauthenticatedError)
      })
    })
  })
})
