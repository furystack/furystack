import type { User } from '@furystack/core'
import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { randomBytes } from 'crypto'

import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import type { ActionResult } from './request-action-implementation.js'
import { JsonResult } from './request-action-implementation.js'

/**
 * A pluggable strategy that turns an authenticated {@link User} into an
 * {@link ActionResult} carrying the session/token payload for the client.
 *
 * Pass a concrete strategy to action factories such as
 * {@link createPasswordLoginAction} or `createGoogleLoginAction` to decouple
 * the authentication mechanism from the session/token mechanism.
 *
 * @typeParam TResult The shape of the response body — e.g. `User` for
 *   cookies, `{ accessToken, refreshToken }` for JWT.
 */
export type LoginResponseStrategy<TResult> = {
  createLoginResponse: (user: User, injector: Injector) => Promise<ActionResult<TResult>>
}

/**
 * Creates a cookie-based {@link LoginResponseStrategy}.
 *
 * On each login it generates a random session id, persists it via the
 * configured session DataSet and returns the user with a `Set-Cookie`
 * response header.
 *
 * @param injector - The injector scope (typically the root) that carries
 *   `HttpAuthenticationSettings` and a persistent session store.
 */
export const createCookieLoginStrategy = (injector: Injector): LoginResponseStrategy<User> => {
  const settings = injector.get(HttpAuthenticationSettings)
  const systemInjector = useSystemIdentityContext({ injector, username: 'CookieLoginStrategy' })
  const sessionDataSet = systemInjector.get(settings.sessionDataSet)

  return {
    createLoginResponse: async (user) => {
      const sessionId = randomBytes(32).toString('hex')
      await sessionDataSet.add(systemInjector, { sessionId, username: user.username })
      return JsonResult(user, 200, {
        'Set-Cookie': `${settings.cookieName}=${sessionId}; Path=/; HttpOnly`,
      })
    },
  }
}
