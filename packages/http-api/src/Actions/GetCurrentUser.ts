import { RequestAction, JsonResult } from '../Models'
import { HttpUserContext } from '../HttpUserContext'

/**
 * Action that returns the current authenticated user
 */
export const GetCurrentUser: RequestAction = async injector => {
  const user = await injector.getInstance(HttpUserContext).getCurrentUser()
  return JsonResult(user)
}
