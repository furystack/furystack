import { HttpUserContext, RequestAction, JsonResult } from '@furystack/http-api'
import { GoogleLoginService } from './login-service'
/**
 * HTTP Request action for Google Logins
 */

export const GoogleLoginAction: RequestAction = async injector => {
  const loginData = await injector.getRequest().readPostBody<{ token: string }>()
  const user = await injector.getInstance(GoogleLoginService).login(loginData.token)
  await injector.getInstance(HttpUserContext).cookieLogin(user, injector.getResponse())
  return JsonResult({ user })
}
