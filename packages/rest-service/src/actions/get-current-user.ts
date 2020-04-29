import { RequestAction, JsonResult } from '@furystack/rest'
import { HttpUserContext } from '../http-user-context'
import { User } from '@furystack/core'
import { Authenticate } from '../authenticate'

/**
 * Action that returns the current authenticated user
 *
 * @param injector The injector from the current stack
 */
export const GetCurrentUser: RequestAction<{
  result: User
}> = Authenticate()(async ({ injector, request }) => {
  const user = await injector.getInstance(HttpUserContext).getCurrentUser(request)
  return JsonResult(user)
})
