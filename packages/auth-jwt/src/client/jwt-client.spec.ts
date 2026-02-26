import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createJwtClient } from './jwt-client.js'
import { createJwtTokenStore } from './jwt-token-store.js'
import type { JwtTokenStoreOptions, TokenPair } from './jwt-token-store.js'

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

describe('createJwtClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let loginMock: ReturnType<typeof vi.fn<JwtTokenStoreOptions['login']>>
  let refreshMock: ReturnType<typeof vi.fn<NonNullable<JwtTokenStoreOptions['refresh']>>>

  beforeEach(() => {
    fetchMock = vi.fn()
    loginMock = vi.fn()
    refreshMock = vi.fn()
  })

  const createTestSetup = (storeOverrides?: Partial<JwtTokenStoreOptions>) => {
    const tokenStore = createJwtTokenStore({
      login: loginMock,
      refresh: refreshMock,
      ...storeOverrides,
    })
    const client = createJwtClient({
      endpointUrl: 'http://localhost:8080/api',
      fetch: fetchMock as unknown as typeof fetch,
      tokenStore,
    })
    return { tokenStore, client }
  }

  describe('call with Bearer injection', () => {
    it('Should inject Authorization header on authenticated calls', async () => {
      const accessToken = createMockToken(futureExp())
      const tokens: TokenPair = { accessToken, refreshToken: 'rt' }
      loginMock.mockResolvedValueOnce(tokens)

      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'result' }),
      })

      const { tokenStore, client } = createTestSetup()
      await tokenStore.login({ username: 'admin', password: 'secret' })
      await client.call({ method: 'GET', action: '/currentUser' } as Parameters<typeof client.call>[0])

      const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect((requestInit.headers as Record<string, string>)?.Authorization).toBe(`Bearer ${accessToken}`)
    })

    it('Should not inject Authorization header when not authenticated', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'result' }),
      })

      const { client } = createTestSetup()
      await client.call({ method: 'GET', action: '/public' } as Parameters<typeof client.call>[0])

      const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect((requestInit.headers as Record<string, string> | undefined)?.Authorization).toBeUndefined()
    })
  })

  describe('proactive token refresh', () => {
    it('Should refresh the token before making the API call', async () => {
      const soonExpiringToken = createMockToken(soonExp())
      const freshToken = createMockToken(futureExp())

      loginMock.mockResolvedValueOnce({ accessToken: soonExpiringToken, refreshToken: 'rt1' })
      refreshMock.mockResolvedValueOnce({ accessToken: freshToken, refreshToken: 'rt2' })

      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'result' }),
      })

      const onAccessTokenChanged = vi.fn()
      const { tokenStore, client } = createTestSetup({ refreshThresholdSeconds: 120, onAccessTokenChanged })

      await tokenStore.login({ username: 'admin', password: 'secret' })
      await client.call({ method: 'GET', action: '/test' } as Parameters<typeof client.call>[0])

      expect(refreshMock).toHaveBeenCalledWith('rt1')
      expect(tokenStore.getAccessToken()).toBe(freshToken)

      const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect((requestInit.headers as Record<string, string>)?.Authorization).toBe(`Bearer ${freshToken}`)
    })
  })

  describe('401 retry', () => {
    it('Should retry once after a 401 response', async () => {
      const accessToken = createMockToken(futureExp())
      const freshToken = createMockToken(futureExp())

      loginMock.mockResolvedValueOnce({ accessToken, refreshToken: 'rt1' })
      refreshMock.mockResolvedValueOnce({ accessToken: freshToken, refreshToken: 'rt2' })

      const error401 = Object.assign(new Error('Unauthorized'), {
        response: { status: 401 } as Response,
      })
      fetchMock.mockRejectedValueOnce(error401).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'result' }),
      })

      const { tokenStore, client } = createTestSetup()
      await tokenStore.login({ username: 'admin', password: 'secret' })

      await client.call({ method: 'GET', action: '/protected' } as Parameters<typeof client.call>[0])

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('Should propagate the original 401 error when the retry also fails', async () => {
      const accessToken = createMockToken(futureExp())
      loginMock.mockResolvedValueOnce({ accessToken, refreshToken: 'rt1' })

      const error401 = Object.assign(new Error('Unauthorized'), {
        response: { status: 401 } as Response,
      })
      fetchMock.mockRejectedValueOnce(error401).mockRejectedValueOnce(new Error('Retry also failed'))

      const { tokenStore, client } = createTestSetup()
      await tokenStore.login({ username: 'admin', password: 'secret' })

      await expect(
        client.call({ method: 'GET', action: '/protected' } as Parameters<typeof client.call>[0]),
      ).rejects.toThrow('Unauthorized')
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('Should propagate non-401 errors', async () => {
      const accessToken = createMockToken(futureExp())
      loginMock.mockResolvedValueOnce({ accessToken, refreshToken: 'rt1' })

      const error500 = new Error('Internal Server Error')
      fetchMock.mockRejectedValueOnce(error500)

      const { tokenStore, client } = createTestSetup()
      await tokenStore.login({ username: 'admin', password: 'secret' })

      await expect(
        client.call({ method: 'GET', action: '/test' } as Parameters<typeof client.call>[0]),
      ).rejects.toThrow('Internal Server Error')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('shared token store across multiple clients', () => {
    it('Should use the same access token for both clients after login', async () => {
      const accessToken = createMockToken(futureExp())
      loginMock.mockResolvedValueOnce({ accessToken, refreshToken: 'rt1' })

      const fetchMockA = vi.fn()
      const fetchMockB = vi.fn()

      const tokenStore = createJwtTokenStore({
        login: loginMock,
        refresh: refreshMock,
      })

      const clientA = createJwtClient({
        endpointUrl: 'http://localhost:8080/api-a',
        fetch: fetchMockA as unknown as typeof fetch,
        tokenStore,
      })

      const clientB = createJwtClient({
        endpointUrl: 'http://localhost:8080/api-b',
        fetch: fetchMockB as unknown as typeof fetch,
        tokenStore,
      })

      fetchMockA.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'from-a' }),
      })
      fetchMockB.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'from-b' }),
      })

      await tokenStore.login({ username: 'admin', password: 'secret' })
      await clientA.call({ method: 'GET', action: '/items' } as Parameters<typeof clientA.call>[0])
      await clientB.call({ method: 'GET', action: '/orders' } as Parameters<typeof clientB.call>[0])

      const [, initA] = fetchMockA.mock.calls[0] as [string, RequestInit]
      const [, initB] = fetchMockB.mock.calls[0] as [string, RequestInit]

      expect((initA.headers as Record<string, string>)?.Authorization).toBe(`Bearer ${accessToken}`)
      expect((initB.headers as Record<string, string>)?.Authorization).toBe(`Bearer ${accessToken}`)
    })

    it('Should reflect refreshed tokens across all clients', async () => {
      const soonExpiringToken = createMockToken(soonExp())
      const freshToken = createMockToken(futureExp())

      loginMock.mockResolvedValueOnce({ accessToken: soonExpiringToken, refreshToken: 'rt1' })
      refreshMock.mockResolvedValueOnce({ accessToken: freshToken, refreshToken: 'rt2' })

      const fetchMockA = vi.fn()
      const fetchMockB = vi.fn()

      const tokenStore = createJwtTokenStore({
        login: loginMock,
        refresh: refreshMock,
        refreshThresholdSeconds: 120,
      })

      const clientA = createJwtClient({
        endpointUrl: 'http://localhost:8080/api-a',
        fetch: fetchMockA as unknown as typeof fetch,
        tokenStore,
      })

      const clientB = createJwtClient({
        endpointUrl: 'http://localhost:8080/api-b',
        fetch: fetchMockB as unknown as typeof fetch,
        tokenStore,
      })

      fetchMockA.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'from-a' }),
      })
      fetchMockB.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'from-b' }),
      })

      await tokenStore.login({ username: 'admin', password: 'secret' })

      // First call triggers refresh
      await clientA.call({ method: 'GET', action: '/items' } as Parameters<typeof clientA.call>[0])
      // Second call should use the already-refreshed token without another refresh
      await clientB.call({ method: 'GET', action: '/orders' } as Parameters<typeof clientB.call>[0])

      expect(refreshMock).toHaveBeenCalledTimes(1)

      const [, initA] = fetchMockA.mock.calls[0] as [string, RequestInit]
      const [, initB] = fetchMockB.mock.calls[0] as [string, RequestInit]

      expect((initA.headers as Record<string, string>)?.Authorization).toBe(`Bearer ${freshToken}`)
      expect((initB.headers as Record<string, string>)?.Authorization).toBe(`Bearer ${freshToken}`)
    })
  })
})
