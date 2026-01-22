import { isAuthenticated } from '@furystack/core'
import { sleepAsync } from '@furystack/utils'
import { HttpUserContext } from './http-user-context.js'
import type { ActionResult, RequestAction, RequestActionOptions } from './request-action-implementation.js'
import { JsonResult } from './request-action-implementation.js'

/**
 * Higher-order function that wraps a request action to require authentication.
 * If the user is not authenticated, returns a 401 Unauthorized response.
 * Includes a random delay on unauthorized requests to mitigate timing attacks.
 *
 * @returns A function that wraps the provided action with authentication check
 * @example
 * ```ts
 * // Wrap an endpoint to require authentication
 * const protectedEndpoint = Authenticate()(myEndpoint)
 *
 * // Or use directly in API definition
 * api: {
 *   GET: {
 *     '/users': Authenticate()(getUsersEndpoint)
 *   }
 * }
 * ```
 */
export const Authenticate =
  () =>
  <T extends { result: unknown }>(action: RequestAction<T>): RequestAction<T> => {
    const wrapped = async (args: RequestActionOptions<T>): Promise<ActionResult<T>> => {
      const { injector } = args
      const authenticated = await isAuthenticated(injector)
      if (!authenticated) {
        await sleepAsync(Math.random() * 1000)
        return JsonResult(
          { error: 'unauthorized' },
          401,
          injector.getInstance(HttpUserContext).authentication.enableBasicAuth ? { 'WWW-Authenticate': 'Basic' } : {},
        ) as unknown as ActionResult<T>
      }
      return (await action(args)) as ActionResult<T>
    }

    wrapped.isAuthenticated = true

    return wrapped
  }
