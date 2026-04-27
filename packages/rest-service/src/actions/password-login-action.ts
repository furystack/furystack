import { RequestError } from '@furystack/rest'
import { sleepAsync } from '@furystack/utils'

import { HttpUserContext } from '../http-user-context.js'
import type { LoginResponseStrategy } from '../login-response-strategy.js'
import type { RequestAction } from '../request-action-implementation.js'

/**
 * Username + password login action. Authenticates via {@link HttpUserContext},
 * then delegates session/token creation to `strategy`. The result type is
 * inferred from the strategy (e.g. `User` for cookies, `{ accessToken,
 * refreshToken }` for JWT). Adds a 0–1 s random delay on failure to mitigate
 * timing attacks; rethrows as `RequestError(400)`.
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
