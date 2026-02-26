import { RequestError } from '@furystack/rest'
import type { LoginResponseStrategy, RequestAction } from '@furystack/rest-service'

import { GoogleLoginService, GoogleLoginSettings } from './login-service.js'

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
 * When {@link GoogleLoginSettings.enableCsrfCheck} is `true`, the action
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
    const settings = injector.getInstance(GoogleLoginSettings)

    if (settings.enableCsrfCheck) {
      const body = await getBody()
      const cookieToken = extractCookieValue(request.headers.cookie, 'g_csrf_token')
      if (!cookieToken || !body.g_csrf_token || cookieToken !== body.g_csrf_token) {
        throw new RequestError('CSRF token validation failed.', 403)
      }
      const user = await injector.getInstance(GoogleLoginService).login(body.token)
      return strategy.createLoginResponse(user, injector)
    }

    const { token } = await getBody()
    const user = await injector.getInstance(GoogleLoginService).login(token)
    return strategy.createLoginResponse(user, injector)
  }
}
