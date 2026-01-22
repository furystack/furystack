import { AuthorizationError, isAuthorized } from '@furystack/core'
import { sleepAsync } from '@furystack/utils'
import type { ActionResult, RequestAction, RequestActionOptions } from './request-action-implementation.js'

/**
 * Higher-order function that wraps a request action to require specific roles.
 * If the user does not have the required roles, throws an AuthorizationError.
 * Includes a random delay on unauthorized requests to mitigate timing attacks.
 *
 * @param roles - The roles required to access the endpoint
 * @returns A function that wraps the provided action with authorization check
 * @example
 * ```ts
 * // Require 'admin' role
 * const adminEndpoint = Authorize('admin')(myEndpoint)
 *
 * // Require multiple roles (user must have ALL specified roles)
 * const superAdminEndpoint = Authorize('admin', 'superuser')(myEndpoint)
 *
 * // Chain with Authenticate for authentication + authorization
 * const protectedEndpoint = Authenticate()(Authorize('admin')(myEndpoint))
 * ```
 */
export const Authorize =
  (...roles: string[]) =>
  <T extends { result: unknown }>(action: RequestAction<T>): RequestAction<T> => {
    return async (options: RequestActionOptions<T>): Promise<ActionResult<T>> => {
      try {
        const authorized = await isAuthorized(options.injector, ...roles)
        if (!authorized) {
          await sleepAsync(Math.random() * 1000)
          throw new AuthorizationError('forbidden')
        }
      } catch (error) {
        throw new AuthorizationError('forbidden')
      }
      return (await action(options)) as ActionResult<T>
    }
  }
