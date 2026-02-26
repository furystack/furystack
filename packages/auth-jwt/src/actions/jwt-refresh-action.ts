import { useSystemIdentityContext } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { HttpUserContext } from '@furystack/rest-service'
import { UnauthenticatedError } from '@furystack/security'
import { usingAsync } from '@furystack/utils'

import { buildFingerprintSetCookie } from '../fingerprint-cookie.js'
import { JwtAuthenticationSettings } from '../jwt-authentication-settings.js'
import { JwtTokenService } from '../jwt-token-service.js'

/**
 * Action that exchanges a valid refresh token for a new access + refresh token pair.
 * Uses token rotation with a configurable grace period.
 * When fingerprint cookie protection is enabled, also sets a new fingerprint cookie.
 */
export const JwtRefreshAction: RequestAction<{
  result: { accessToken: string; refreshToken: string }
  body: { refreshToken: string }
}> = async ({ injector, getBody }) => {
  const body = await getBody()
  const tokenService = injector.getInstance(JwtTokenService)
  const settings = injector.getInstance(JwtAuthenticationSettings)
  try {
    const { username, replacedByToken } = await tokenService.verifyRefreshToken(body.refreshToken)

    const userContext = injector.getInstance(HttpUserContext)
    const userDataSet = userContext.getUserDataSet()
    const user = await usingAsync(
      useSystemIdentityContext({ injector, username: 'JwtRefreshAction' }),
      async (systemInjector) => {
        const users = await userDataSet.find(systemInjector, { filter: { username: { $eq: username } }, top: 2 })
        if (users.length !== 1) {
          throw new UnauthenticatedError()
        }
        return users[0]
      },
    )

    if (replacedByToken) {
      const { token: accessToken, fingerprint } = tokenService.signAccessToken(user)
      const headers = fingerprint
        ? { 'Set-Cookie': buildFingerprintSetCookie(fingerprint, settings.fingerprintCookie) }
        : undefined
      return JsonResult({ accessToken, refreshToken: replacedByToken }, 200, headers)
    }

    const { token: newAccessToken, fingerprint } = tokenService.signAccessToken(user)
    const newRefreshToken = await tokenService.signRefreshToken(user)
    await tokenService.rotateRefreshToken(body.refreshToken, newRefreshToken)
    const headers = fingerprint
      ? { 'Set-Cookie': buildFingerprintSetCookie(fingerprint, settings.fingerprintCookie) }
      : undefined
    return JsonResult({ accessToken: newAccessToken, refreshToken: newRefreshToken }, 200, headers)
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      throw new RequestError('Token refresh failed', 401)
    }
    throw error
  }
}
