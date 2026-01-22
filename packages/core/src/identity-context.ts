import { Injectable } from '@furystack/inject'
import type { User } from './models/user.js'

/**
 * Provides authentication and authorization context for the current request/session.
 * This is a base implementation that should be extended or replaced with a concrete
 * implementation that connects to your authentication system.
 *
 * The IdentityContext is scoped to the request, meaning each request gets its own instance.
 * Override this class or set an explicit instance to provide actual authentication logic.
 *
 * @example
 * ```ts
 * // Use the helper functions instead of accessing IdentityContext directly
 * import { isAuthenticated, isAuthorized, getCurrentUser } from '@furystack/core'
 *
 * const authenticated = await isAuthenticated(injector)
 * const authorized = await isAuthorized(injector, 'admin')
 * const user = await getCurrentUser(injector)
 * ```
 */
@Injectable({ lifetime: 'scoped' })
export class IdentityContext {
  /**
   * Checks if the current user is authenticated.
   * @returns Promise resolving to true if authenticated, false otherwise
   */
  public isAuthenticated() {
    return Promise.resolve(false)
  }

  /**
   * Checks if the current user has the specified roles.
   * @param _roles - The roles to check
   * @returns Promise resolving to true if authorized, false otherwise
   */
  public isAuthorized(..._roles: string[]) {
    return Promise.resolve(false)
  }

  /**
   * Gets the current authenticated user.
   * @returns Promise resolving to the current user
   * @throws Error if no user is authenticated
   */
  public getCurrentUser<TUser extends User>(): Promise<TUser> {
    throw new Error('No IdentityContext')
  }
}
