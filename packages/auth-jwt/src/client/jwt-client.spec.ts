import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createJwtClient } from './jwt-client.js'

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

describe('createJwtClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
  })

  const createTestClient = () =>
    createJwtClient(
      {
        endpointUrl: 'http://localhost:8080/api',
        fetch: fetchMock as unknown as typeof fetch,
      },
      '/jwt/login',
      '/jwt/refresh',
      '/jwt/logout',
    )

  describe('login', () => {
    it('Should call the login endpoint and store tokens', async () => {
      const tokens = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'refresh-token-value',
      }
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      })

      const client = createTestClient()
      const result = await client.login({ username: 'admin', password: 'secret' })

      expect(result.accessToken).toBe(tokens.accessToken)
      expect(result.refreshToken).toBe(tokens.refreshToken)
      expect(client.isAuthenticated).toBe(true)
      expect(client.getAccessToken()).toBe(tokens.accessToken)
    })
  })

  describe('logout', () => {
    it('Should call the logout endpoint and clear tokens', async () => {
      const tokens = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'refresh-token-value',
      }
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => tokens })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

      const client = createTestClient()
      await client.login({ username: 'admin', password: 'secret' })
      await client.logout()

      expect(client.isAuthenticated).toBe(false)
      expect(client.getAccessToken()).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('Should return false when not logged in', () => {
      const client = createTestClient()
      expect(client.isAuthenticated).toBe(false)
    })

    it('Should return false when token is expired', async () => {
      const tokens = {
        accessToken: createMockToken(pastExp()),
        refreshToken: 'refresh-token',
      }
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => tokens })

      const client = createTestClient()
      await client.login({ username: 'admin', password: 'secret' })
      expect(client.isAuthenticated).toBe(false)
    })
  })

  describe('setTokens', () => {
    it('Should allow setting tokens directly', () => {
      const client = createTestClient()
      const tokens = {
        accessToken: createMockToken(futureExp()),
        refreshToken: 'refresh-token',
      }
      client.setTokens(tokens)
      expect(client.isAuthenticated).toBe(true)
      expect(client.getAccessToken()).toBe(tokens.accessToken)
    })
  })

  describe('call with Bearer injection', () => {
    it('Should inject Authorization header on authenticated calls', async () => {
      const accessToken = createMockToken(futureExp())
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken, refreshToken: 'rt' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ data: 'result' }),
        })

      const client = createTestClient()
      await client.login({ username: 'admin', password: 'secret' })
      await client.call({ method: 'GET', action: '/currentUser' } as Parameters<typeof client.call>[0])

      const secondCall = fetchMock.mock.calls[1] as [string, RequestInit]
      expect((secondCall[1].headers as Record<string, string>)?.Authorization).toBe(`Bearer ${accessToken}`)
    })
  })

  describe('proactive token refresh', () => {
    it('Should refresh the token before it expires', async () => {
      const soonExpiringToken = createMockToken(soonExp())
      const freshToken = createMockToken(futureExp())

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken: soonExpiringToken, refreshToken: 'rt1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken: freshToken, refreshToken: 'rt2' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ data: 'result' }),
        })

      const onTokenRefreshed = vi.fn()
      const client = createJwtClient(
        {
          endpointUrl: 'http://localhost:8080/api',
          fetch: fetchMock as unknown as typeof fetch,
          refreshThresholdSeconds: 120,
          onTokenRefreshed,
        },
        '/jwt/login',
        '/jwt/refresh',
      )

      await client.login({ username: 'admin', password: 'secret' })
      await client.call({ method: 'GET', action: '/test' } as Parameters<typeof client.call>[0])

      expect(onTokenRefreshed).toHaveBeenCalledWith({ accessToken: freshToken, refreshToken: 'rt2' })
      expect(client.getAccessToken()).toBe(freshToken)
    })
  })
})
