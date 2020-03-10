import { RequestAction, JsonResult } from '@furystack/rest'
import { HttpUserContext } from '../http-user-context'
import { User } from '@furystack/core'

/**
 * Action that returns the current authenticated user
 *
 * @param injector The injector from the current stack
 */
export const GetCurrentUser: RequestAction<User, undefined, undefined> = async ({ injector }) => {
  const user = await injector.getInstance(HttpUserContext).getCurrentUser()
  return JsonResult(user)
}
