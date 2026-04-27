import { HttpUserContext } from '../http-user-context.js'
import type { RequestAction } from '../request-action-implementation.js'
import { EmptyResult } from '../request-action-implementation.js'

/**
 * Logs out via {@link HttpUserContext.cookieLogout} — clears the session
 * cookie and removes the session row from the session DataSet.
 */
export const LogoutAction: RequestAction<{ result: unknown }> = async ({ injector, request, response }) => {
  await injector.get(HttpUserContext).cookieLogout(request, response)
  return EmptyResult()
}
