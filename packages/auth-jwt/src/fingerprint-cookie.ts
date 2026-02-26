import type { IncomingMessage } from 'http'

import type { FingerprintCookieSettings } from './jwt-authentication-settings.js'

/**
 * Builds a `Set-Cookie` header value for the fingerprint cookie.
 * @param fingerprint The raw fingerprint value
 * @param settings Fingerprint cookie settings
 * @returns The `Set-Cookie` header string
 */
export const buildFingerprintSetCookie = (fingerprint: string, settings: FingerprintCookieSettings): string => {
  const parts = [`${settings.name}=${fingerprint}`, `Path=${settings.path}`, 'HttpOnly']
  if (settings.secure) {
    parts.push('Secure')
  }
  parts.push(`SameSite=${settings.sameSite}`)
  return parts.join('; ')
}

/**
 * Builds a `Set-Cookie` header value that clears the fingerprint cookie.
 * @param settings Fingerprint cookie settings
 * @returns The `Set-Cookie` header string with Max-Age=0
 */
export const clearFingerprintSetCookie = (settings: FingerprintCookieSettings): string => {
  const parts = [`${settings.name}=`, `Path=${settings.path}`, 'HttpOnly', 'Max-Age=0']
  if (settings.secure) {
    parts.push('Secure')
  }
  parts.push(`SameSite=${settings.sameSite}`)
  return parts.join('; ')
}

/**
 * Extracts the fingerprint value from the request's `Cookie` header.
 * @param request The incoming HTTP request
 * @param cookieName The name of the fingerprint cookie
 * @returns The fingerprint value, or `null` if not found
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
      return valueParts.join('=').trim() || null
    }
  }
  return null
}
