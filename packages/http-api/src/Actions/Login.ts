import { HttpUserContext } from '../HttpUserContext'
import { RequestAction, JsonResult } from '../Models'

/**
 * Action that logs in the current user
 * Should be called with a JSON Post body with ``username`` and ``password`` fields.
 * Returns the current user instance
 */

export const LoginAction: RequestAction = async injector => {
  const msg = injector.getRequest()
  const userContext = injector.getInstance(HttpUserContext)
  const response = injector.getResponse()
  const loginData = await msg.readPostBody<{ username: string; password: string }>()
  const user = await userContext.cookieLogin(loginData.username, loginData.password, response)
  if (user === userContext.authentication.visitorUser) {
    return JsonResult({
      statusCode: 400,
      json: { message: 'Login failed' },
    })
  }
  return JsonResult(user)
}
