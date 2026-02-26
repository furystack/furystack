import { describe, expect, it, vi, beforeEach } from 'vitest'

import { googleLogin } from './google-login.js'

describe('googleLogin', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('Should POST the credential to the endpoint', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ username: 'user' }) }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response)

    await googleLogin({ endpointUrl: '/api/auth/google', credential: 'id-token-123' })

    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: 'id-token-123' }),
    })
  })

  it('Should return the parsed JSON response', async () => {
    const expected = { username: 'user@example.com', roles: ['admin'] }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(expected),
    } as Response)

    const result = await googleLogin<{ username: string; roles: string[] }>({
      endpointUrl: '/api/auth/google',
      credential: 'token',
    })

    expect(result).toEqual(expected)
  })

  it('Should throw on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response)

    await expect(googleLogin({ endpointUrl: '/api/auth/google', credential: 'bad' })).rejects.toThrow(
      'Google login failed: 401',
    )
  })

  it('Should throw on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

    await expect(googleLogin({ endpointUrl: '/api/auth/google', credential: 'tok' })).rejects.toThrow('fetch failed')
  })
})
