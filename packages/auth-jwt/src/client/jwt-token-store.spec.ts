import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { JwtTokenStoreOptions, TokenPair } from './jwt-token-store.js'
import { createJwtTokenStore } from './jwt-token-store.js'

const createMockToken = (exp: number) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const payload = btoa(JSON.stringify({ sub: 'testuser', roles: ['admin'], iat: Math.floor(Date.now() / 1000), exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${header}.${payload}.fakesignature`
}

const futureExp = () => Math.floor(Date.now() / 1000) + 3600
const soonExp = () => Math.floor(Date.now() / 1000) + 30
const pastExp = () => Math.floor(Date.now() / 1000) - 60

describe('createJwtTokenStore', () => {
  let loginMock: ReturnType<typeof vi.fn<JwtTokenStoreOptions['login']>>
  let refreshMock: ReturnType<typeof vi.fn<NonNullable<JwtTokenStoreOptions['refresh']>>>
  let logoutMock: ReturnType<typeof vi.fn<NonNullable<JwtTokenStoreOptions['logout']>>>

  beforeEach(() => {
    loginMock = vi.fn()
    refreshMock = vi.fn()
    logoutMock = vi.fn()
  })

  const createTestStore = (overrides?: Partial<JwtTokenStoreOptions>) =>
    createJwtTokenStore({
      login: loginMock,
      refresh: refreshMock,
      logout: logoutMock,
      ...overrides,
    })

  describe('login', () => {
    it('Should call the login callback and store tokens', async () => {
      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'refresh-token-value',
      }
      loginMock.mockResolvedValueOnce(tokens)

      const store = createTestStore()
      const result = await store.login({ username: 'admin', password: 'secret' })

      expect(loginMock).toHaveBeenCalledWith({ username: 'admin', password: 'secret' })
      expect(result.accessToken).toBe(tokens.accessToken)
      expect(result.refreshToken).toBe(tokens.refreshToken)
      expect(store.isAuthenticated).toBe(true)
      expect(store.getAccessToken()).toBe(tokens.accessToken)
    })

    it('Should fire change callbacks on login', async () => {
      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      loginMock.mockResolvedValueOnce(tokens)

      const onAccessTokenChanged = vi.fn()
      const onRefreshTokenChanged = vi.fn()
      const store = createTestStore({ onAccessTokenChanged, onRefreshTokenChanged })

      await store.login({ username: 'admin', password: 'secret' })

      expect(onAccessTokenChanged).toHaveBeenCalledWith(tokens.accessToken)
      expect(onRefreshTokenChanged).toHaveBeenCalledWith(tokens.refreshToken)
    })
  })

  describe('logout', () => {
    it('Should call the logout callback and clear tokens', async () => {
      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      loginMock.mockResolvedValueOnce(tokens)
      logoutMock.mockResolvedValueOnce(undefined)

      const store = createTestStore()
      await store.login({ username: 'admin', password: 'secret' })
      await store.logout()

      expect(logoutMock).toHaveBeenCalledWith('rt-1')
      expect(store.isAuthenticated).toBe(false)
      expect(store.getAccessToken()).toBeNull()
    })

    it('Should fire change callbacks with null on logout', async () => {
      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      loginMock.mockResolvedValueOnce(tokens)
      logoutMock.mockResolvedValueOnce(undefined)

      const onAccessTokenChanged = vi.fn()
      const onRefreshTokenChanged = vi.fn()
      const store = createTestStore({ onAccessTokenChanged, onRefreshTokenChanged })

      await store.login({ username: 'admin', password: 'secret' })
      onAccessTokenChanged.mockClear()
      onRefreshTokenChanged.mockClear()

      await store.logout()

      expect(onAccessTokenChanged).toHaveBeenCalledWith(null)
      expect(onRefreshTokenChanged).toHaveBeenCalledWith(null)
    })

    it('Should clear tokens even if the logout callback fails', async () => {
      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      loginMock.mockResolvedValueOnce(tokens)
      logoutMock.mockRejectedValueOnce(new Error('Network error'))

      const store = createTestStore()
      await store.login({ username: 'admin', password: 'secret' })
      await store.logout()

      expect(store.isAuthenticated).toBe(false)
      expect(store.getAccessToken()).toBeNull()
    })

    it('Should work without a logout callback', async () => {
      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      loginMock.mockResolvedValueOnce(tokens)

      const store = createTestStore({ logout: undefined })
      await store.login({ username: 'admin', password: 'secret' })
      await store.logout()

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('isAuthenticated', () => {
    it('Should return false when not logged in', () => {
      const store = createTestStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('Should return false when access token is expired', async () => {
      const tokens: TokenPair = {
        accessToken: createMockToken(pastExp()),
        refreshToken: 'rt-1',
      }
      loginMock.mockResolvedValueOnce(tokens)

      const store = createTestStore()
      await store.login({ username: 'admin', password: 'secret' })
      expect(store.isAuthenticated).toBe(false)
    })

    it('Should return true when access token is valid', async () => {
      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      loginMock.mockResolvedValueOnce(tokens)

      const store = createTestStore()
      await store.login({ username: 'admin', password: 'secret' })
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('setTokens', () => {
    it('Should allow setting tokens directly', () => {
      const store = createTestStore()
      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      store.setTokens(tokens)
      expect(store.isAuthenticated).toBe(true)
      expect(store.getAccessToken()).toBe(tokens.accessToken)
    })

    it('Should fire change callbacks when setting tokens', () => {
      const onAccessTokenChanged = vi.fn()
      const onRefreshTokenChanged = vi.fn()
      const store = createTestStore({ onAccessTokenChanged, onRefreshTokenChanged })

      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      store.setTokens(tokens)

      expect(onAccessTokenChanged).toHaveBeenCalledWith(tokens.accessToken)
      expect(onRefreshTokenChanged).toHaveBeenCalledWith(tokens.refreshToken)
    })

    it('Should not fire change callbacks when tokens are unchanged', () => {
      const onAccessTokenChanged = vi.fn()
      const onRefreshTokenChanged = vi.fn()
      const store = createTestStore({ onAccessTokenChanged, onRefreshTokenChanged })

      const tokens: TokenPair = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt-1',
      }
      store.setTokens(tokens)
      onAccessTokenChanged.mockClear()
      onRefreshTokenChanged.mockClear()

      store.setTokens(tokens)

      expect(onAccessTokenChanged).not.toHaveBeenCalled()
      expect(onRefreshTokenChanged).not.toHaveBeenCalled()
    })
  })

  describe('ensureValidToken (proactive refresh)', () => {
    it('Should refresh the token when it is about to expire', async () => {
      const soonExpiringToken = createMockToken(soonExp())
      const freshToken = createMockToken(futureExp())

      loginMock.mockResolvedValueOnce({ accessToken: soonExpiringToken, refreshToken: 'rt1' })
      refreshMock.mockResolvedValueOnce({ accessToken: freshToken, refreshToken: 'rt2' })

      const onAccessTokenChanged = vi.fn()
      const store = createTestStore({ refreshThresholdSeconds: 120, onAccessTokenChanged })

      await store.login({ username: 'admin', password: 'secret' })
      onAccessTokenChanged.mockClear()

      await store.ensureValidToken()

      expect(refreshMock).toHaveBeenCalledWith('rt1')
      expect(store.getAccessToken()).toBe(freshToken)
      expect(onAccessTokenChanged).toHaveBeenCalledWith(freshToken)
    })

    it('Should not refresh when the token is still valid', async () => {
      loginMock.mockResolvedValueOnce({
        accessToken: createMockToken(futureExp()),
        refreshToken: 'rt1',
      })

      const store = createTestStore()
      await store.login({ username: 'admin', password: 'secret' })
      await store.ensureValidToken()

      expect(refreshMock).not.toHaveBeenCalled()
    })

    it('Should queue concurrent refresh calls', async () => {
      const soonExpiringToken = createMockToken(soonExp())
      const freshToken = createMockToken(futureExp())

      loginMock.mockResolvedValueOnce({ accessToken: soonExpiringToken, refreshToken: 'rt1' })
      refreshMock.mockResolvedValueOnce({ accessToken: freshToken, refreshToken: 'rt2' })

      const store = createTestStore({ refreshThresholdSeconds: 120 })
      await store.login({ username: 'admin', password: 'secret' })

      await Promise.all([store.ensureValidToken(), store.ensureValidToken(), store.ensureValidToken()])

      expect(refreshMock).toHaveBeenCalledTimes(1)
    })

    it('Should call onRefreshFailed and clear tokens on refresh error', async () => {
      const soonExpiringToken = createMockToken(soonExp())
      const refreshError = new Error('Refresh failed')

      loginMock.mockResolvedValueOnce({ accessToken: soonExpiringToken, refreshToken: 'rt1' })
      refreshMock.mockRejectedValueOnce(refreshError)

      const onRefreshFailed = vi.fn()
      const onAccessTokenChanged = vi.fn()
      const store = createTestStore({ refreshThresholdSeconds: 120, onRefreshFailed, onAccessTokenChanged })

      await store.login({ username: 'admin', password: 'secret' })
      onAccessTokenChanged.mockClear()

      await expect(store.ensureValidToken()).rejects.toThrow('Refresh failed')

      expect(onRefreshFailed).toHaveBeenCalledWith(refreshError)
      expect(store.getAccessToken()).toBeNull()
      expect(onAccessTokenChanged).toHaveBeenCalledWith(null)
    })

    it('Should do nothing when not authenticated', async () => {
      const store = createTestStore()
      await store.ensureValidToken()
      expect(refreshMock).not.toHaveBeenCalled()
    })
  })

  describe('forceRefresh', () => {
    it('Should refresh even when the token has not expired', async () => {
      const validToken = createMockToken(futureExp())
      const freshToken = createMockToken(futureExp())

      loginMock.mockResolvedValueOnce({ accessToken: validToken, refreshToken: 'rt1' })
      refreshMock.mockResolvedValueOnce({ accessToken: freshToken, refreshToken: 'rt2' })

      const store = createTestStore()
      await store.login({ username: 'admin', password: 'secret' })

      await store.forceRefresh()

      expect(refreshMock).toHaveBeenCalledWith('rt1')
      expect(store.getAccessToken()).toBe(freshToken)
    })

    it('Should do nothing when not authenticated', async () => {
      const store = createTestStore()
      await store.forceRefresh()
      expect(refreshMock).not.toHaveBeenCalled()
    })

    it('Should queue concurrent forceRefresh calls', async () => {
      const validToken = createMockToken(futureExp())
      const freshToken = createMockToken(futureExp())

      loginMock.mockResolvedValueOnce({ accessToken: validToken, refreshToken: 'rt1' })
      refreshMock.mockResolvedValueOnce({ accessToken: freshToken, refreshToken: 'rt2' })

      const store = createTestStore()
      await store.login({ username: 'admin', password: 'secret' })

      await Promise.all([store.forceRefresh(), store.forceRefresh(), store.forceRefresh()])

      expect(refreshMock).toHaveBeenCalledTimes(1)
    })

    it('Should call onRefreshFailed and clear tokens on forceRefresh error', async () => {
      const validToken = createMockToken(futureExp())
      const refreshError = new Error('Refresh failed')

      loginMock.mockResolvedValueOnce({ accessToken: validToken, refreshToken: 'rt1' })
      refreshMock.mockRejectedValueOnce(refreshError)

      const onRefreshFailed = vi.fn()
      const store = createTestStore({ onRefreshFailed })

      await store.login({ username: 'admin', password: 'secret' })
      await expect(store.forceRefresh()).rejects.toThrow('Refresh failed')

      expect(onRefreshFailed).toHaveBeenCalledWith(refreshError)
      expect(store.getAccessToken()).toBeNull()
    })
  })

  describe('decodeTokenExp edge cases', () => {
    it('Should treat a token with fewer than 3 parts as not authenticated', () => {
      const store = createTestStore()
      store.setTokens({ accessToken: 'not-a-jwt', refreshToken: 'rt-1' })
      expect(store.isAuthenticated).toBe(false)
    })

    it('Should treat a token with invalid base64 payload as not authenticated', () => {
      const store = createTestStore()
      store.setTokens({ accessToken: 'header.!!!invalid-base64!!!.signature', refreshToken: 'rt-1' })
      expect(store.isAuthenticated).toBe(false)
    })

    it('Should treat a token without an exp claim as not authenticated', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      const payload = btoa(JSON.stringify({ sub: 'testuser' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      const tokenWithoutExp = `${header}.${payload}.fakesignature`

      const store = createTestStore()
      store.setTokens({ accessToken: tokenWithoutExp, refreshToken: 'rt-1' })
      expect(store.isAuthenticated).toBe(false)
    })

    it('Should trigger refresh when exp claim is missing', async () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      const payload = btoa(JSON.stringify({ sub: 'testuser' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      const tokenWithoutExp = `${header}.${payload}.fakesignature`

      const freshToken = createMockToken(futureExp())
      refreshMock.mockResolvedValueOnce({ accessToken: freshToken, refreshToken: 'rt2' })

      const store = createTestStore()
      store.setTokens({ accessToken: tokenWithoutExp, refreshToken: 'rt1' })

      await store.ensureValidToken()

      expect(refreshMock).toHaveBeenCalledWith('rt1')
      expect(store.getAccessToken()).toBe(freshToken)
    })
  })

  describe('EventHub integration', () => {
    it('should emit onAccessTokenChanged via subscribe', async () => {
      const handler = vi.fn()
      const token: TokenPair = { accessToken: createMockToken(futureExp()), refreshToken: 'rt1' }
      loginMock.mockResolvedValueOnce(token)

      const store = createTestStore()
      store.subscribe('onAccessTokenChanged', handler)

      await store.login({ username: 'test', password: 'pass' })

      expect(handler).toHaveBeenCalledWith(token.accessToken)
    })

    it('should emit onRefreshTokenChanged via subscribe', async () => {
      const handler = vi.fn()
      const token: TokenPair = { accessToken: createMockToken(futureExp()), refreshToken: 'rt1' }
      loginMock.mockResolvedValueOnce(token)

      const store = createTestStore()
      store.subscribe('onRefreshTokenChanged', handler)

      await store.login({ username: 'test', password: 'pass' })

      expect(handler).toHaveBeenCalledWith('rt1')
    })

    it('should support multiple subscribers for the same event', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const token: TokenPair = { accessToken: createMockToken(futureExp()), refreshToken: 'rt1' }
      loginMock.mockResolvedValueOnce(token)

      const store = createTestStore()
      store.addListener('onAccessTokenChanged', handler1)
      store.addListener('onAccessTokenChanged', handler2)

      await store.login({ username: 'test', password: 'pass' })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should still support legacy option callbacks alongside EventHub', async () => {
      const legacyHandler = vi.fn()
      const eventHandler = vi.fn()
      const token: TokenPair = { accessToken: createMockToken(futureExp()), refreshToken: 'rt1' }
      loginMock.mockResolvedValueOnce(token)

      const store = createTestStore({ onAccessTokenChanged: legacyHandler })
      store.addListener('onAccessTokenChanged', eventHandler)

      await store.login({ username: 'test', password: 'pass' })

      expect(legacyHandler).toHaveBeenCalledWith(token.accessToken)
      expect(eventHandler).toHaveBeenCalledWith(token.accessToken)
    })

    it('should dispose the internal EventHub', () => {
      const store = createTestStore()
      expect(() => store[Symbol.dispose]()).not.toThrow()
    })
  })
})
