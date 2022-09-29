import { HttpUserContext, JsonResult } from '@furystack/rest-service'
import type { RequestAction } from '@furystack/rest-service'
import { GoogleLoginService } from './login-service'
import type { User } from '@furystack/core'
/**
 * HTTP Request action for Google Logins
 */

export const GoogleLoginAction: RequestAction<{ result: User; body: { token: string } }> = async ({
  injector,
  getBody,
  response,
}) => {
  const { token } = await getBody()
  const user = await injector.getInstance(GoogleLoginService).login(token)
  await injector.getInstance(HttpUserContext).cookieLogin(user, response)
  return JsonResult(user)
}
