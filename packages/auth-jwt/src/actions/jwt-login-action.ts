import type { User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult, HttpUserContext, createPasswordLoginAction } from '@furystack/rest-service'
import { sleepAsync } from '@furystack/utils'

import { fingerprintSetCookieHeaders } from '../fingerprint-cookie.js'
import { JwtAuthenticationSettings } from '../jwt-authentication-settings.js'
import { JwtTokenService } from '../jwt-token-service.js'
import { createJwtLoginStrategy } from '../jwt-login-response-strategy.js'

/**
 * Creates a password-based login action that returns JWT tokens.
 *
 * This composes {@link createPasswordLoginAction} with
 * {@link createJwtLoginStrategy} for a ready-to-use JWT login endpoint.
 *
 * @param injector The root injector (must have JWT authentication configured
 *   via `useJwtAuthentication`)
 * @returns A `RequestAction` that accepts `{ username, password }` and returns
 *   `{ accessToken, refreshToken }`
 */
export const createJwtLoginAction = (
  injector: Injector,
): RequestAction<{
  result: { accessToken: string; refreshToken: string }
  body: { username: string; password: string }
}> => createPasswordLoginAction(createJwtLoginStrategy(injector))

/**
 * Action that authenticates a user and returns JWT access + refresh tokens.
 * When fingerprint cookie protection is enabled, also sets the fingerprint cookie.
 * Should be called with a JSON POST body with `username` and `password` fields.
 *
 * @deprecated Use `createJwtLoginAction(injector)` or
 * `createPasswordLoginAction(createJwtLoginStrategy(injector))` instead.
 * This static action resolves services from the request-scoped injector on
 * every call; the factory approach captures them once at setup time.
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
    return JsonResult(
      { accessToken, refreshToken },
      200,
      fingerprintSetCookieHeaders(fingerprint, settings.fingerprintCookie),
    )
  } catch (error) {
    await sleepAsync(Math.random() * 1000)
    throw new RequestError('Login Failed', 400)
  }
}
