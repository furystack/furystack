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
  try {
    const user = await userContext.authenticateUser(loginData.username, loginData.password)
    await userContext.cookieLogin(user, response)
    return JsonResult(user)
  } catch (error) {
    return JsonResult(
      {
        message: 'Login failed',
      },
      400,
    )
  }
}
