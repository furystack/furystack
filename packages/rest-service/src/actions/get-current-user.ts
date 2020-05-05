import { RequestAction, JsonResult } from '@furystack/rest'
import { User } from '@furystack/core'
import { Authenticate } from '../authenticate'

/**
 * Action that returns the current authenticated user
 *
 * @param injector The injector from the current stack
 */
export const GetCurrentUser: RequestAction<{
  result: User
}> = Authenticate()(async ({ injector }) => {
  const user = await injector.getCurrentUser()
  return JsonResult(user)
})
