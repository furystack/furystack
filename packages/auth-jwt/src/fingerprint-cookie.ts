import type { IncomingMessage } from 'http'

import type { FingerprintCookieSettings } from './jwt-authentication-settings.js'

/** Builds the `Set-Cookie` header value that installs the fingerprint cookie. */
export const buildFingerprintSetCookie = (fingerprint: string, settings: FingerprintCookieSettings): string => {
  const parts = [`${settings.name}=${encodeURIComponent(fingerprint)}`, `Path=${settings.path}`, 'HttpOnly']
  if (settings.secure) {
    parts.push('Secure')
  }
  parts.push(`SameSite=${settings.sameSite}`)
  return parts.join('; ')
}

/** Builds the `Set-Cookie` header value that clears the fingerprint cookie (`Max-Age=0`). */
export const clearFingerprintSetCookie = (settings: FingerprintCookieSettings): string => {
  const parts = [`${settings.name}=`, `Path=${settings.path}`, 'HttpOnly', 'Max-Age=0']
  if (settings.secure) {
    parts.push('Secure')
  }
  parts.push(`SameSite=${settings.sameSite}`)
  return parts.join('; ')
}

/**
 * Returns the `Set-Cookie` response headers for a fingerprint, or `undefined` if fingerprinting is disabled.
 */
export const fingerprintSetCookieHeaders = (
  fingerprint: string | null,
  settings: FingerprintCookieSettings,
): Record<string, string> | undefined => {
  if (!fingerprint) return undefined
  return { 'Set-Cookie': buildFingerprintSetCookie(fingerprint, settings) }
}

/**
 * Returns the `Set-Cookie` response headers that clear the fingerprint cookie, or `undefined` if fingerprinting is disabled.
 */
export const fingerprintClearCookieHeaders = (
  settings: FingerprintCookieSettings,
): Record<string, string> | undefined => {
  if (!settings.enabled) return undefined
  return { 'Set-Cookie': clearFingerprintSetCookie(settings) }
}

/**
 * Reads the fingerprint cookie value from the request's `Cookie` header.
 * Returns `null` when absent or empty. Decoded with `decodeURIComponent`;
 * malformed values are returned raw rather than throwing.
 */
export const extractFingerprintCookie = (
  request: Pick<IncomingMessage, 'headers'>,
  cookieName: string,
): string | null => {
  const cookieHeader = request.headers.cookie
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=')
    if (name?.trim() === cookieName) {
      const raw = valueParts.join('=').trim()
      if (!raw) return null
      try {
        return decodeURIComponent(raw)
      } catch {
        return raw
      }
    }
  }
  return null
}
