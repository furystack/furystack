import { RequestAction, JsonResult } from '../Models'
import { HttpUserContext } from '../HttpUserContext'

/**
 * Action that returns if the current user is authenticated
 */
export const IsAuthenticated: RequestAction = async injector => {
  const isAuthenticated = await injector.getInstance(HttpUserContext).isAuthenticated()
  return JsonResult({ isAuthenticated })
}
