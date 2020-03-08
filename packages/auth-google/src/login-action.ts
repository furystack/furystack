import { RequestAction, JsonResult } from '@furystack/rest'
import { HttpUserContext } from '@furystack/rest-service'
import { GoogleLoginService } from './login-service'
import { User } from '@furystack/core'
/**
 * HTTP Request action for Google Logins
 */

export const GoogleLoginAction: RequestAction<User, undefined, { token: string }> = async ({ injector, body }) => {
  const user = await injector.getInstance(GoogleLoginService).login(body.token)
  await injector.getInstance(HttpUserContext).cookieLogin(user, injector.getResponse())
  return JsonResult(user)
}
