import type { Injector } from '@furystack/inject'
import type { LoginResponseStrategy } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'

import { fingerprintSetCookieHeaders } from './fingerprint-cookie.js'
import { JwtAuthenticationSettings } from './jwt-authentication-settings.js'
import { JwtTokenService } from './jwt-token-service.js'

/**
 * Creates a JWT-based {@link LoginResponseStrategy}.
 *
 * On each login it signs a short-lived access token and a long-lived
 * refresh token for the authenticated user. When fingerprint cookie
 * protection is enabled, the fingerprint cookie header is included
 * in the response.
 *
 * @param injector The root injector (must have {@link JwtAuthenticationSettings}
 *   and {@link JwtTokenService} configured via `useJwtAuthentication`)
 * @returns A strategy that returns `ActionResult<{ accessToken: string; refreshToken: string }>`
 */
export const createJwtLoginStrategy = (
  injector: Injector,
): LoginResponseStrategy<{ accessToken: string; refreshToken: string }> => {
  const tokenService = injector.get(JwtTokenService)
  const settings = injector.get(JwtAuthenticationSettings)

  return {
    createLoginResponse: async (user) => {
      const { token: accessToken, fingerprint } = tokenService.signAccessToken(user)
      const refreshToken = await tokenService.signRefreshToken(user)
      return JsonResult(
        { accessToken, refreshToken },
        200,
        fingerprintSetCookieHeaders(fingerprint, settings.fingerprintCookie),
      )
    },
  }
}
