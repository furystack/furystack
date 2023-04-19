import type { User } from '@furystack/core'
import { getCurrentUser } from '@furystack/core'
import { Authenticate } from '../authenticate'
import type { RequestAction } from '../request-action-implementation'
import { JsonResult } from '../request-action-implementation'

/**
 * Action that returns the current authenticated user
 * @param injector The injector from the current stack
 */
export const GetCurrentUser: RequestAction<{
  result: User
}> = Authenticate()(async ({ injector }) => {
  const user = await getCurrentUser(injector)
  return JsonResult(user)
})
