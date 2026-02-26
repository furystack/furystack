import { InMemoryStore, StoreManager, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { PasswordCredential, UnauthenticatedError } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage } from 'http'
import { describe, expect, it } from 'vitest'
import { JwtAuthenticationSettings } from '../jwt-authentication-settings.js'
import { JwtTokenService } from '../jwt-token-service.js'
import { RefreshToken } from '../models/refresh-token.js'
import { createJwtAuthProvider } from './jwt-auth-provider.js'

const SECRET = 'a-very-secret-key-at-least-32-bytes-long!'

const setupInjector = (i: Injector) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  const settings = Object.assign(new JwtAuthenticationSettings(), { secret: SECRET })
  i.setExplicitInstance(settings, JwtAuthenticationSettings)
}

describe('createJwtAuthProvider', () => {
  const testUser: User = { username: 'testuser', roles: ['admin'] }

  it('Should return null for requests without Bearer header', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
      const provider = createJwtAuthProvider({
        jwtTokenService: i.getInstance(JwtTokenService),
        userStore,
      })
      const result = await provider.authenticate({ headers: {} } as IncomingMessage)
      expect(result).toBeNull()
    })
  })

  it('Should return null for requests with non-Bearer authorization', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
      const provider = createJwtAuthProvider({
        jwtTokenService: i.getInstance(JwtTokenService),
        userStore,
      })
      const result = await provider.authenticate({
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      } as IncomingMessage)
      expect(result).toBeNull()
    })
  })

  it('Should return the user for a valid Bearer token', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
      await userStore.add(testUser)
      const tokenService = i.getInstance(JwtTokenService)
      const token = tokenService.signAccessToken(testUser)
      const provider = createJwtAuthProvider({ jwtTokenService: tokenService, userStore })
      const result = await provider.authenticate({
        headers: { authorization: `Bearer ${token}` },
      } as IncomingMessage)
      expect(result).toEqual(testUser)
    })
  })

  it('Should throw UnauthenticatedError for invalid Bearer token', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
      const tokenService = i.getInstance(JwtTokenService)
      const provider = createJwtAuthProvider({ jwtTokenService: tokenService, userStore })
      await expect(
        provider.authenticate({
          headers: { authorization: 'Bearer invalid.token.here' },
        } as IncomingMessage),
      ).rejects.toThrow(UnauthenticatedError)
    })
  })

  it('Should throw UnauthenticatedError when user not found', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupInjector(i)
      const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
      const tokenService = i.getInstance(JwtTokenService)
      const token = tokenService.signAccessToken(testUser)
      const provider = createJwtAuthProvider({ jwtTokenService: tokenService, userStore })
      await expect(
        provider.authenticate({
          headers: { authorization: `Bearer ${token}` },
        } as IncomingMessage),
      ).rejects.toThrow(UnauthenticatedError)
    })
  })
})
