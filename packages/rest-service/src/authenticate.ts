import { isAuthenticated } from '@furystack/core'
import { sleepAsync } from '@furystack/utils'
import { HttpUserContext } from './http-user-context.js'
import type { ActionResult, RequestAction, RequestActionOptions } from './request-action-implementation.js'
import { JsonResult } from './request-action-implementation.js'

/**
 * Wraps a {@link RequestAction} to require authentication. Unauthenticated
 * requests return `401 Unauthorized` (with `WWW-Authenticate: Basic` when
 * the chain includes Basic Auth). Adds a 0–1 s random delay on rejection to
 * mitigate timing attacks.
 *
 * @example
 * ```ts
 * api: {
 *   GET: { '/users': Authenticate()(getUsersEndpoint) },
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
        const hasBasicAuth = injector
          .get(HttpUserContext)
          .authentication.authenticationProviders.some((p) => p.name === 'basic-auth')
        return JsonResult(
          { error: 'unauthorized' },
          401,
          hasBasicAuth ? { 'WWW-Authenticate': 'Basic' } : {},
        ) as unknown as ActionResult<T>
      }
      return (await action(args)) as ActionResult<T>
    }

    wrapped.isAuthenticated = true

    return wrapped
  }
