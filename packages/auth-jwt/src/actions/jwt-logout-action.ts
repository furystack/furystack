import type { RequestAction } from '@furystack/rest-service'
import { EmptyResult } from '@furystack/rest-service'

import { fingerprintClearCookieHeaders } from '../fingerprint-cookie.js'
import { JwtAuthenticationSettings } from '../jwt-authentication-settings.js'
import { JwtTokenService } from '../jwt-token-service.js'

/**
 * Action that revokes a refresh token (hard revocation, no grace period).
 * When fingerprint cookie protection is enabled, also clears the fingerprint cookie.
 */
export const JwtLogoutAction: RequestAction<{
  result: unknown
  body: { refreshToken: string }
}> = async ({ injector, getBody }) => {
  const body = await getBody()
  await injector.get(JwtTokenService).revokeRefreshToken(body.refreshToken)
  const settings = injector.get(JwtAuthenticationSettings)
  return EmptyResult(200, fingerprintClearCookieHeaders(settings.fingerprintCookie))
}
