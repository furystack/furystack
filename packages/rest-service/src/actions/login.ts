import { HttpUserContext } from '../http-user-context.js'
import '../helpers.js'
import type { User } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'

/**
 * Action that logs in the current user
 * Should be called with a JSON Post body with ``username`` and ``password`` fields.
 * Returns the current user instance
 */

export const LoginAction: RequestAction<{
  result: User
  body: { username: string; password: string }
}> = async ({ injector, getBody, response }) => {
  const userContext = injector.getInstance(HttpUserContext)
  const body = await getBody()
  try {
    const user = await userContext.authenticateUser(body.username, body.password)
    await userContext.cookieLogin(user, response)
    return JsonResult(user, 200)
  } catch (error) {
    throw new RequestError('Login Failed', 400)
  }
}
