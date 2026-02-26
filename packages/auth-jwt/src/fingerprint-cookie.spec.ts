import type { IncomingMessage } from 'http'
import { describe, expect, it } from 'vitest'

import type { FingerprintCookieSettings } from './jwt-authentication-settings.js'
import { buildFingerprintSetCookie, clearFingerprintSetCookie, extractFingerprintCookie } from './fingerprint-cookie.js'

const DEFAULT_SETTINGS: FingerprintCookieSettings = {
  enabled: true,
  name: 'fpt',
  sameSite: 'Strict',
  secure: true,
  path: '/',
}

describe('buildFingerprintSetCookie', () => {
  it('Should build a Set-Cookie string with all attributes', () => {
    const result = buildFingerprintSetCookie('abc123', DEFAULT_SETTINGS)
    expect(result).toBe('fpt=abc123; Path=/; HttpOnly; Secure; SameSite=Strict')
  })

  it('Should omit Secure when disabled', () => {
    const result = buildFingerprintSetCookie('abc123', { ...DEFAULT_SETTINGS, secure: false })
    expect(result).not.toContain('Secure')
    expect(result).toBe('fpt=abc123; Path=/; HttpOnly; SameSite=Strict')
  })

  it('Should use custom cookie name and path', () => {
    const result = buildFingerprintSetCookie('val', { ...DEFAULT_SETTINGS, name: '__Secure-fpt', path: '/api' })
    expect(result).toContain('__Secure-fpt=val')
    expect(result).toContain('Path=/api')
  })

  it('Should respect SameSite=Lax', () => {
    const result = buildFingerprintSetCookie('val', { ...DEFAULT_SETTINGS, sameSite: 'Lax' })
    expect(result).toContain('SameSite=Lax')
  })

  it('Should respect SameSite=None', () => {
    const result = buildFingerprintSetCookie('val', { ...DEFAULT_SETTINGS, sameSite: 'None' })
    expect(result).toContain('SameSite=None')
  })
})

describe('clearFingerprintSetCookie', () => {
  it('Should build a Set-Cookie string that clears the cookie', () => {
    const result = clearFingerprintSetCookie(DEFAULT_SETTINGS)
    expect(result).toBe('fpt=; Path=/; HttpOnly; Max-Age=0; Secure; SameSite=Strict')
  })

  it('Should omit Secure when disabled', () => {
    const result = clearFingerprintSetCookie({ ...DEFAULT_SETTINGS, secure: false })
    expect(result).not.toContain('Secure')
    expect(result).toContain('Max-Age=0')
  })
})

describe('extractFingerprintCookie', () => {
  it('Should extract the fingerprint from a simple Cookie header', () => {
    const request = { headers: { cookie: 'fpt=abc123' } } as Pick<IncomingMessage, 'headers'>
    expect(extractFingerprintCookie(request, 'fpt')).toBe('abc123')
  })

  it('Should extract the fingerprint from a Cookie header with multiple cookies', () => {
    const request = { headers: { cookie: 'session=xyz; fpt=abc123; other=val' } } as Pick<IncomingMessage, 'headers'>
    expect(extractFingerprintCookie(request, 'fpt')).toBe('abc123')
  })

  it('Should return null when the cookie is not present', () => {
    const request = { headers: { cookie: 'session=xyz; other=val' } } as Pick<IncomingMessage, 'headers'>
    expect(extractFingerprintCookie(request, 'fpt')).toBeNull()
  })

  it('Should return null when there is no Cookie header', () => {
    const request = { headers: {} } as Pick<IncomingMessage, 'headers'>
    expect(extractFingerprintCookie(request, 'fpt')).toBeNull()
  })

  it('Should handle cookies with = in the value', () => {
    const request = { headers: { cookie: 'fpt=abc=123=456' } } as Pick<IncomingMessage, 'headers'>
    expect(extractFingerprintCookie(request, 'fpt')).toBe('abc=123=456')
  })

  it('Should handle whitespace around cookie name and value', () => {
    const request = { headers: { cookie: ' fpt = abc123 ; other=val' } } as Pick<IncomingMessage, 'headers'>
    expect(extractFingerprintCookie(request, 'fpt')).toBe('abc123')
  })
})
