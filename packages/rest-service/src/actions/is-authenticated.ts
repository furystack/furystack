import { RequestAction, JsonResult } from '@furystack/rest'
import { HttpUserContext } from '../http-user-context'

/**
 * Action that returns if the current user is authenticated
 *
 * @param injector The injector from the current stack
 */
export const IsAuthenticated: RequestAction<{ result: { isAuthenticated: boolean } }> = async ({ injector }) => {
  const isAuthenticated = await injector.getInstance(HttpUserContext).isAuthenticated()
  return JsonResult({ isAuthenticated })
}
