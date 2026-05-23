import type { Injector } from '@furystack/inject'
import { sleepAsync } from '@furystack/utils'
import { HttpUserContext } from '@furystack/rest-service'
import type { IncomingMessage } from 'node:http'

/**
 * REST surface action that authorization is applied to. Each task type may
 * specify a different role list per action.
 */
export type RouteAction = 'submit' | 'start' | 'cancel' | 'get' | 'download' | 'subscribe'

/**
 * Per-type authorizer specification. Roles per action are AND-ed; the
 * requesting identity must satisfy every role in the array.
 *
 * Missing keys fall back to "authenticated only" — the request must
 * carry a valid identity but no specific role is required. Apps that
 * want public unauthenticated access for a given action set the array
 * to `[]` and override the default authentication check via
 * `requireAuthentication: false` (TODO future).
 */
export type AuthorizerSpec = Partial<Record<RouteAction, string[]>>

/**
 * Result of {@link authorize}. On rejection the helper supplies the HTTP
 * status, a discriminated `code`, and a human-readable `message` the
 * caller writes back as a JSON error envelope.
 */
export type AuthorizeResult = { ok: true } | { ok: false; status: number; code: string; message: string }

/**
 * Per-action authorization for the task-runner REST surface. Reuses
 * `@furystack/core` `isAuthenticated` / `isAuthorized` against an
 * `IdentityContext` bound from {@link HttpUserContext} for the current
 * request. Adds a 0–1 s random delay on rejection to mitigate timing
 * attacks (mirrors `Authorize` in `@furystack/rest-service`).
 */
export const authorize = async (args: {
  injector: Injector
  req: IncomingMessage
  type: string
  action: RouteAction
  authorizers: Record<string, AuthorizerSpec>
}): Promise<AuthorizeResult> => {
  const { injector, req, type, action, authorizers } = args

  // Resolves the per-scope HttpUserContext that carries the bound
  // authentication providers + the request-scoped user cache. Calls
  // `isAuthenticated` / `isAuthorized` directly with the request — these
  // methods consult the providers themselves, so no extra
  // `IdentityContext` scope-bind round-trip is required.
  const userContext = injector.get(HttpUserContext)
  const authed = await userContext.isAuthenticated(req)
  if (!authed) {
    return { ok: false, status: 401, code: 'unauthenticated', message: 'Authentication required' }
  }

  const roles = authorizers[type]?.[action]
  if (roles && roles.length > 0) {
    const ok = await userContext.isAuthorized(req, ...roles)
    if (!ok) {
      await sleepAsync(Math.random() * 1000)
      return { ok: false, status: 403, code: 'forbidden', message: `Role(s) required: ${roles.join(', ')}` }
    }
  }
  return { ok: true }
}
