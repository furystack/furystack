import { isAuthenticated } from '@furystack/core'
import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'

/**
 * Returns `{ isAuthenticated: boolean }`. Unauthenticated callers receive
 * a 200 with `false` rather than a 401 — use this when the client needs to
 * branch on auth state without triggering a re-login flow.
 */
export const IsAuthenticated: RequestAction<{ result: { isAuthenticated: boolean } }> = async ({ injector }) => {
  const isAuthenticatedResult = await isAuthenticated(injector)
  return JsonResult({ isAuthenticated: isAuthenticatedResult })
}
