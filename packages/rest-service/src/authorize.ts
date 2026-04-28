import { AuthorizationError, isAuthorized } from '@furystack/core'
import { sleepAsync } from '@furystack/utils'
import type { Authenticate } from './authenticate.js'
import type { ActionResult, RequestAction, RequestActionOptions } from './request-action-implementation.js'

/**
 * Wraps a {@link RequestAction} to require **all** specified roles. Throws
 * {@link AuthorizationError} (translated to 403 by `ErrorAction`) when any
 * role is missing. Adds a 0–1 s random delay on rejection to mitigate
 * timing attacks. Compose with {@link Authenticate} to require both:
 * `Authenticate()(Authorize('admin')(myEndpoint))`.
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
