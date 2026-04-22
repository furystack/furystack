import type { Injector } from '@furystack/inject'
import type { RequestAction } from '@furystack/rest-service'
import { createPasswordLoginAction } from '@furystack/rest-service'

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
