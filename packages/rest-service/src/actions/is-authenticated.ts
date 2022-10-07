import { isAuthenticated } from '@furystack/core'
import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'

/**
 * Action that returns if the current user is authenticated
 *
 * @param options The options for the Custom Action
 * @param options.injector The Injector from the current context
 * @returns A standard authentication result
 */
export const IsAuthenticated: RequestAction<{ result: { isAuthenticated: boolean } }> = async ({ injector }) => {
  const isAuthenticatedResult = await isAuthenticated(injector)
  return JsonResult({ isAuthenticated: isAuthenticatedResult })
}
