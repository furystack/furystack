import { HttpUserContext } from '../http-user-context'
import { RequestAction, JsonResult } from '@furystack/rest'
import '../injector-extensions'
import { User } from '@furystack/core'
import { RequestError } from './request-error'

/**
 * Action that logs in the current user
 * Should be called with a JSON Post body with ``username`` and ``password`` fields.
 * Returns the current user instance
 */

export const LoginAction: RequestAction<
  User | { message: string },
  undefined,
  { username: string; password: string }
> = async ({ injector, body }) => {
  const userContext = injector.getInstance(HttpUserContext)
  const response = injector.getResponse()
  try {
    const user = await userContext.authenticateUser(body.username, body.password)
    await userContext.cookieLogin(user, response)
    return JsonResult(user, 200)
  } catch (error) {
    throw new RequestError('Login Failed', 400)
  }
}
