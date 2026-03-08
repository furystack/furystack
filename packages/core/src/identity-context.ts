import { Injectable } from '@furystack/inject'
import type { User } from './models/user.js'

/**
 * Provides authentication and authorization context for the current request/session.
 * This is a base implementation that should be extended or replaced with a concrete
 * implementation that connects to your authentication system.
 *
 * The IdentityContext uses `explicit` lifetime, meaning it must be provided via
 * `setExplicitInstance` or a setup helper (e.g. {@link useSystemIdentityContext})
 * before it can be resolved with `getInstance`. Child injectors automatically
 * inherit the instance from their parent, so you only need to set it once on the
 * root (or request-scoped) injector.
 *
 * @example
 * ```ts
 * // Set up the context on your root or request injector
 * injector.setExplicitInstance(myIdentityContextImpl, IdentityContext)
 *
 * // Then use the helper functions from any injector in the hierarchy
 * import { isAuthenticated, isAuthorized, getCurrentUser } from '@furystack/core'
 *
 * const authenticated = await isAuthenticated(childInjector)
 * const authorized = await isAuthorized(childInjector, 'admin')
 * const user = await getCurrentUser(childInjector)
 * ```
 */
@Injectable({ lifetime: 'explicit' })
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
