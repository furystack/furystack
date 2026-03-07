import { describe, expect, it } from 'vitest'
import type { AuthenticationProvider } from '../authentication-providers/authentication-provider.js'
import { mapProvidersToSecuritySchemes } from './auth-provider-to-security-scheme.js'

const createProvider = (name: string): AuthenticationProvider => ({
  name,
  authenticate: async () => null,
})

describe('mapProvidersToSecuritySchemes', () => {
  it('Should map basic-auth to HTTP Basic scheme', () => {
    const result = mapProvidersToSecuritySchemes([createProvider('basic-auth')])
    expect(result.basicAuth).toEqual({ type: 'http', scheme: 'basic' })
  })

  it('Should map cookie-auth to apiKey cookie scheme', () => {
    const result = mapProvidersToSecuritySchemes([createProvider('cookie-auth')])
    expect(result.cookieAuth).toEqual({ type: 'apiKey', in: 'cookie', name: 'session' })
  })

  it('Should map jwt-bearer to HTTP Bearer scheme', () => {
    const result = mapProvidersToSecuritySchemes([createProvider('jwt-bearer')])
    expect(result.bearerAuth).toEqual({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
  })

  it('Should map multiple providers', () => {
    const result = mapProvidersToSecuritySchemes([
      createProvider('basic-auth'),
      createProvider('cookie-auth'),
      createProvider('jwt-bearer'),
    ])
    expect(Object.keys(result).sort()).toEqual(['basicAuth', 'bearerAuth', 'cookieAuth'])
  })

  it('Should ignore unknown provider names', () => {
    const result = mapProvidersToSecuritySchemes([createProvider('jwt-bearer'), createProvider('custom-unknown-auth')])
    expect(result.bearerAuth).toBeDefined()
    expect(Object.keys(result)).toEqual(['bearerAuth'])
  })

  it('Should fall back to cookieAuth when no known providers are found', () => {
    const result = mapProvidersToSecuritySchemes([createProvider('unknown-provider')])
    expect(result).toEqual({ cookieAuth: { type: 'apiKey', in: 'cookie', name: 'session' } })
  })

  it('Should fall back to cookieAuth for empty provider list', () => {
    const result = mapProvidersToSecuritySchemes([])
    expect(result).toEqual({ cookieAuth: { type: 'apiKey', in: 'cookie', name: 'session' } })
  })
})
