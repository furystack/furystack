import type { User } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import { sleepAsync } from '@furystack/utils'

import { HttpUserContext } from '../http-user-context.js'
import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'

/**
 * Action that logs in the current user.
 * Should be called with a JSON POST body with `username` and `password` fields.
 * Returns the current user instance.
 *
 * @deprecated Use `createPasswordLoginAction(createCookieLoginStrategy(injector))` instead.
 * This static action resolves services from the request-scoped injector on
 * every call; the factory approach captures them once at setup time.
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
  } catch {
    await sleepAsync(Math.random() * 1000)
    throw new RequestError('Login Failed', 400)
  }
}
