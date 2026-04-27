import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import type { User } from './models/user.js'

/**
 * Provides authentication and authorization context for the current
 * request/session.
 *
 * The default implementation exposed by the {@link IdentityContext} token is
 * intentionally minimal: `isAuthenticated` and `isAuthorized` both resolve to
 * `false`, and `getCurrentUser` rejects. Applications override this by
 * rebinding the token on the request-scoped injector — typically from an
 * authentication provider.
 *
 * @example
 * ```ts
 * requestScope.bind(IdentityContext, () => myAuthenticatedContext)
 *
 * const authenticated = await isAuthenticated(requestScope)
 * const authorized = await isAuthorized(requestScope, 'admin')
 * const user = await getCurrentUser(requestScope)
 * ```
 */
export interface IdentityContext {
  isAuthenticated(): Promise<boolean>
  /** Returns `true` only when the user holds **every** role. */
  isAuthorized(...roles: string[]): Promise<boolean>
  /**
   * Resolves with the current user. The default implementation rejects
   * because no user is bound — applications override the token on the
   * request scope to provide an authenticated identity.
   *
   * @typeParam TUser - Concrete user type the caller expects.
   */
  getCurrentUser<TUser extends User>(): Promise<TUser>
}

/**
 * DI token for the current {@link IdentityContext}. Scoped — each injector
 * scope resolves and caches its own context. Default factory is
 * unauthenticated; rebind on the request scope to inject an authenticated
 * identity.
 */
export const IdentityContext: Token<IdentityContext, 'scoped'> = defineService({
  name: '@furystack/core/IdentityContext',
  lifetime: 'scoped',
  factory: () => ({
    isAuthenticated: () => Promise.resolve(false),
    isAuthorized: () => Promise.resolve(false),
    getCurrentUser: <TUser extends User>() => Promise.reject<TUser>(new Error('No IdentityContext')),
  }),
})
