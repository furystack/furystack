import { InMemoryStore, StoreManager, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { PasswordCredential, UnauthenticatedError } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { JwtAuthenticationSettings } from './jwt-authentication-settings.js'
import { JwtTokenService } from './jwt-token-service.js'
import { base64UrlEncode, signHs256 } from './jwt-utils.js'
import { RefreshToken } from './models/refresh-token.js'

const SECRET = 'a-very-secret-key-at-least-32-bytes-long!'

const setupInjector = (i: Injector, overrides?: Partial<JwtAuthenticationSettings>) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))

  const settings = Object.assign(new JwtAuthenticationSettings(), { secret: SECRET, ...overrides })
  i.setExplicitInstance(settings, JwtAuthenticationSettings)
}

describe('JwtTokenService', () => {
  const testUser: User = { username: 'testuser', roles: ['admin', 'user'] }

  describe('signAccessToken / verifyAccessToken', () => {
    it('Should sign and verify an access token', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)
        const token = service.signAccessToken(testUser)
        const payload = service.verifyAccessToken(token)
        expect(payload.sub).toBe('testuser')
        expect(payload.roles).toEqual(['admin', 'user'])
        expect(payload.exp).toBeGreaterThan(payload.iat)
      })
    })

    it('Should include issuer and audience when configured', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i, { issuer: 'my-app', audience: 'my-client' })
        const service = i.getInstance(JwtTokenService)
        const token = service.signAccessToken(testUser)
        const payload = service.verifyAccessToken(token)
        expect(payload.iss).toBe('my-app')
        expect(payload.aud).toBe('my-client')
      })
    })

    it('Should reject a token with wrong issuer', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i, { issuer: 'correct-issuer' })
        const service = i.getInstance(JwtTokenService)

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

    it('Should reject an expired token', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i, { clockSkewToleranceSeconds: 0 })
        const service = i.getInstance(JwtTokenService)

        const now = Math.floor(Date.now() / 1000)
        const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = base64UrlEncode(JSON.stringify({ sub: 'testuser', roles: [], iat: now - 1000, exp: now - 100 }))
        const sig = signHs256(`${header}.${payload}`, SECRET)
        const token = `${header}.${payload}.${sig}`

        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject a token with alg: none', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)

        const now = Math.floor(Date.now() / 1000)
        const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }))
        const payload = base64UrlEncode(JSON.stringify({ sub: 'testuser', roles: [], iat: now, exp: now + 900 }))
        const token = `${header}.${payload}.`

        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject a token with wrong alg (RS256)', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)

        const now = Math.floor(Date.now() / 1000)
        const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
        const payload = base64UrlEncode(JSON.stringify({ sub: 'testuser', roles: [], iat: now, exp: now + 900 }))
        const sig = signHs256(`${header}.${payload}`, SECRET)
        const token = `${header}.${payload}.${sig}`

        expect(() => service.verifyAccessToken(token)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject a tampered token', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)
        const token = service.signAccessToken(testUser)
        const parts = token.split('.')
        const tamperedPayload = base64UrlEncode(
          JSON.stringify({ sub: 'hacker', roles: ['admin'], iat: 0, exp: 99999999999 }),
        )
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`

        expect(() => service.verifyAccessToken(tamperedToken)).toThrow(UnauthenticatedError)
      })
    })

    it('Should reject an invalid format token', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)
        expect(() => service.verifyAccessToken('not-a-jwt')).toThrow(UnauthenticatedError)
        expect(() => service.verifyAccessToken('')).toThrow(UnauthenticatedError)
      })
    })
  })

  describe('signRefreshToken / verifyRefreshToken', () => {
    it('Should sign and verify a refresh token', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)
        const token = await service.signRefreshToken(testUser)
        expect(typeof token).toBe('string')
        expect(token.length).toBe(64)
        const result = await service.verifyRefreshToken(token)
        expect(result.username).toBe('testuser')
        expect(result.replacedByToken).toBeUndefined()
      })
    })

    it('Should reject a non-existent refresh token', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)
        await expect(service.verifyRefreshToken('nonexistent')).rejects.toThrow(UnauthenticatedError)
      })
    })

    it('Should reject an expired refresh token', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i, { refreshTokenExpirationSeconds: -1 })
        const service = i.getInstance(JwtTokenService)
        const token = await service.signRefreshToken(testUser)
        await expect(service.verifyRefreshToken(token)).rejects.toThrow(UnauthenticatedError)
      })
    })
  })

  describe('Token rotation with grace period', () => {
    it('Should accept a rotated token within grace period and return replacement', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i, { refreshTokenRotationGracePeriodSeconds: 60 })
        const service = i.getInstance(JwtTokenService)
        const oldToken = await service.signRefreshToken(testUser)
        const newToken = await service.signRefreshToken(testUser)
        await service.rotateRefreshToken(oldToken, newToken)

        const result = await service.verifyRefreshToken(oldToken)
        expect(result.username).toBe('testuser')
        expect(result.replacedByToken).toBe(newToken)
      })
    })

    it('Should reject a rotated token beyond grace period', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i, { refreshTokenRotationGracePeriodSeconds: 0 })
        const service = i.getInstance(JwtTokenService)
        const oldToken = await service.signRefreshToken(testUser)
        const newToken = await service.signRefreshToken(testUser)

        const store = i.getInstance(StoreManager).getStoreFor(RefreshToken, 'token')
        await store.update(oldToken, {
          revokedAt: new Date(Date.now() - 10000).toISOString(),
          replacedByToken: newToken,
        } as Partial<RefreshToken>)

        await expect(service.verifyRefreshToken(oldToken)).rejects.toThrow(UnauthenticatedError)
      })
    })
  })

  describe('revokeRefreshToken', () => {
    it('Should remove the token from the store', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)
        const token = await service.signRefreshToken(testUser)
        await service.revokeRefreshToken(token)
        await expect(service.verifyRefreshToken(token)).rejects.toThrow(UnauthenticatedError)
      })
    })

    it('Should not throw for a non-existent token', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)
        await expect(service.revokeRefreshToken('nonexistent')).resolves.not.toThrow()
      })
    })
  })

  describe('revokeAllRefreshTokensForUser', () => {
    it('Should remove all tokens for a user', async () => {
      await usingAsync(new Injector(), async (i) => {
        setupInjector(i)
        const service = i.getInstance(JwtTokenService)
        const token1 = await service.signRefreshToken(testUser)
        const token2 = await service.signRefreshToken(testUser)
        await service.revokeAllRefreshTokensForUser('testuser')
        await expect(service.verifyRefreshToken(token1)).rejects.toThrow(UnauthenticatedError)
        await expect(service.verifyRefreshToken(token2)).rejects.toThrow(UnauthenticatedError)
      })
    })
  })
})
