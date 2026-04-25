import { RequestError } from '@furystack/rest'
import { sleepAsync } from '@furystack/utils'

import { HttpUserContext } from '../http-user-context.js'
import type { LoginResponseStrategy } from '../login-response-strategy.js'
import type { RequestAction } from '../request-action-implementation.js'

/**
 * Creates a login {@link RequestAction} that authenticates a user by
 * username + password, then delegates session/token creation to the
 * provided {@link LoginResponseStrategy}.
 *
 * The return type is inferred from the strategy:
 * - Cookie strategy -> `ActionResult<User>`
 * - JWT strategy   -> `ActionResult<{ accessToken: string; refreshToken: string }>`
 *
 * A random delay (0-1 s) is added on failure to mitigate timing attacks.
 *
 * @param strategy The login response strategy that produces the session/token result
 * @returns A `RequestAction` that can be wired into a REST API route
 */
export const createPasswordLoginAction = <TResult>(
  strategy: LoginResponseStrategy<TResult>,
): RequestAction<{ result: TResult; body: { username: string; password: string } }> => {
  return async ({ injector, getBody }) => {
    const body = await getBody()
    try {
      const user = await injector.get(HttpUserContext).authenticateUser(body.username, body.password)
      return strategy.createLoginResponse(user, injector)
    } catch {
      await sleepAsync(Math.random() * 1000)
      throw new RequestError('Login Failed', 400)
    }
  }
}
