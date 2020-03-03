import { RequestAction, JsonResult } from '../models/request-action'
import { HttpUserContext } from '../http-user-context'

/**
 * Action that returns the current authenticated user
 *
 * @param injector The injector from the current stack
 */
export const GetCurrentUser: RequestAction = async injector => {
  const user = await injector.getInstance(HttpUserContext).getCurrentUser()
  return JsonResult(user)
}
