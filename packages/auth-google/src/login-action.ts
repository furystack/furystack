import type { LoginResponseStrategy, RequestAction } from '@furystack/rest-service'

import { GoogleLoginService } from './login-service.js'

/**
 * Creates a Google OAuth login {@link RequestAction} that validates a
 * Google ID token, resolves the local user, then delegates session/token
 * creation to the provided {@link LoginResponseStrategy}.
 *
 * The return type is inferred from the strategy:
 * - Cookie strategy -> `ActionResult<User>`
 * - JWT strategy   -> `ActionResult<{ accessToken: string; refreshToken: string }>`
 *
 * @param strategy The login response strategy that produces the session/token result
 * @returns A `RequestAction` that can be wired into a REST API route
 */
export const createGoogleLoginAction = <TResult>(
  strategy: LoginResponseStrategy<TResult>,
): RequestAction<{ result: TResult; body: { token: string } }> => {
  return async ({ injector, getBody }) => {
    const { token } = await getBody()
    const user = await injector.getInstance(GoogleLoginService).login(token)
    return strategy.createLoginResponse(user, injector)
  }
}
