import { HttpUserContext } from '../HttpUserContext'
import { RequestAction, JsonResult } from '../Models'

/**
 * Action that logs out the current user
 */
export const LogoutAction: RequestAction = async injector => {
  await injector.getInstance(HttpUserContext).cookieLogout(injector.getRequest(), injector.getResponse())
  return JsonResult({ success: true })
}
