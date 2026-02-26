import type { User } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { HttpUserContext } from '@furystack/rest-service'
import { sleepAsync } from '@furystack/utils'

import { buildFingerprintSetCookie } from '../fingerprint-cookie.js'
import { JwtAuthenticationSettings } from '../jwt-authentication-settings.js'
import { JwtTokenService } from '../jwt-token-service.js'

/**
 * Action that authenticates a user and returns JWT access + refresh tokens.
 * When fingerprint cookie protection is enabled, also sets the fingerprint cookie.
 * Should be called with a JSON POST body with `username` and `password` fields.
 */
export const JwtLoginAction: RequestAction<{
  result: { accessToken: string; refreshToken: string }
  body: { username: string; password: string }
}> = async ({ injector, getBody }) => {
  const body = await getBody()
  const userContext = injector.getInstance(HttpUserContext)
  try {
    const user: User = await userContext.authenticateUser(body.username, body.password)
    const tokenService = injector.getInstance(JwtTokenService)
    const settings = injector.getInstance(JwtAuthenticationSettings)
    const { token: accessToken, fingerprint } = tokenService.signAccessToken(user)
    const refreshToken = await tokenService.signRefreshToken(user)
    const headers = fingerprint
      ? { 'Set-Cookie': buildFingerprintSetCookie(fingerprint, settings.fingerprintCookie) }
      : undefined
    return JsonResult({ accessToken, refreshToken }, 200, headers)
  } catch (error) {
    await sleepAsync(Math.random() * 1000)
    throw new RequestError('Login Failed', 400)
  }
}
