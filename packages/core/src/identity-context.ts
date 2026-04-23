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
  /**
   * Checks if the current user is authenticated.
   *
   * @returns Promise resolving to `true` if authenticated, `false` otherwise.
   */
  isAuthenticated(): Promise<boolean>

  /**
   * Checks if the current user has **all** of the specified roles.
   *
   * @param roles - The roles to check.
   * @returns Promise resolving to `true` if authorized, `false` otherwise.
   */
  isAuthorized(...roles: string[]): Promise<boolean>

  /**
   * Returns the currently authenticated user.
   *
   * @typeParam TUser - Concrete user type expected by the caller. The default
   *   implementation rejects because it has no user to return.
   * @returns Promise that resolves to the current user or rejects when no
   *   user is available.
   */
  getCurrentUser<TUser extends User>(): Promise<TUser>
}

/**
 * DI token for the current {@link IdentityContext}. Scoped by design: each
 * injector scope resolves the token once and caches the value for the
 * lifetime of that scope.
 *
 * The default factory returns an unauthenticated context. Call
 * `injector.bind(IdentityContext, () => customContext)` on the request scope
 * to inject an authenticated identity for that scope only.
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
