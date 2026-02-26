import { RequestError } from '@furystack/rest'
import type { LoginResponseStrategy, RequestAction } from '@furystack/rest-service'

import { GoogleLoginService } from './login-service.js'

const extractCookieValue = (cookieHeader: string | undefined, name: string): string | undefined => {
  if (!cookieHeader) return undefined
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
  return match?.split('=')[1]
}

/**
 * Creates a Google OAuth login {@link RequestAction} that validates a
 * Google ID token, resolves the local user, then delegates session/token
 * creation to the provided {@link LoginResponseStrategy}.
 *
 * When {@link GoogleLoginService.enableCsrfCheck} is `true`, the action
 * validates the `g_csrf_token` double-submit cookie sent by Google
 * Identity Services before proceeding.
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
): RequestAction<{ result: TResult; body: { token: string; g_csrf_token?: string } }> => {
  return async ({ injector, getBody, request }) => {
    const service = injector.getInstance(GoogleLoginService)
    const body = await getBody()

    if (service.enableCsrfCheck) {
      const cookieToken = extractCookieValue(request.headers.cookie, 'g_csrf_token')
      if (!cookieToken || !body.g_csrf_token || cookieToken !== body.g_csrf_token) {
        throw new RequestError('CSRF token validation failed.', 403)
      }
    }

    const googleData = await service.getGoogleUserData(body.token)
    const user = await service.getUserFromGooglePayload(googleData)
    if (!user) {
      throw new RequestError('Attached user not found.', 401)
    }
    return strategy.createLoginResponse(user, injector)
  }
}
