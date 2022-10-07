import type { User } from '@furystack/core'
import { getCurrentUser } from '@furystack/core'
import { Authenticate } from '../authenticate.js'
import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'

/**
 * Action that returns the current authenticated user
 *
 * @param injector The injector from the current stack
 */
export const GetCurrentUser: RequestAction<{
  result: User
}> = Authenticate()(async ({ injector }) => {
  const user = await getCurrentUser(injector)
  return JsonResult(user)
})
