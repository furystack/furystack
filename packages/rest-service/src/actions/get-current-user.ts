import type { User } from '@furystack/core'
import { getCurrentUser } from '@furystack/core'
import { Authenticate } from '../authenticate.js'
import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'

/** Returns the current authenticated user; 401 if no user is bound. */
export const GetCurrentUser: RequestAction<{
  result: User
}> = Authenticate()(async ({ injector }) => {
  const user = await getCurrentUser(injector)
  return JsonResult(user)
})
