import { User } from '@furystack/core'
import { Authenticate } from '../authenticate'
import { JsonResult, RequestAction } from '../request-action-implementation'

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
