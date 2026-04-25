import type { Injector } from '@furystack/inject'
import { globalDisposables } from './global-disposables.js'
import { IdentityContext } from './identity-context.js'

/**
 * Registers a disposable or async-disposable to be torn down on process exit.
 *
 * @param disposable - The object to dispose when the process exits.
 * @returns The shared set of global disposables (same reference for every call).
 */
export const disposeOnProcessExit = (disposable: Disposable | AsyncDisposable): Set<Disposable | AsyncDisposable> =>
  globalDisposables.add(disposable)

/**
 * Resolves the {@link IdentityContext} on the given injector and asks whether
 * the current user is authenticated.
 *
 * @param injector - Any injector in the scope hierarchy that carries the
 *   identity to test (usually a request scope).
 * @returns The authentication status reported by the resolved context.
 */
export const isAuthenticated = async (injector: Injector): Promise<boolean> =>
  injector.get(IdentityContext).isAuthenticated()

/**
 * Resolves the {@link IdentityContext} and asks whether the current user has
 * **all** of the specified roles.
 *
 * @param injector - Injector carrying the identity to test.
 * @param roles - Roles the user must hold.
 * @returns Whether the user is authorized against every role in `roles`.
 */
export const isAuthorized = async (injector: Injector, ...roles: string[]): Promise<boolean> =>
  injector.get(IdentityContext).isAuthorized(...roles)

/**
 * Resolves the {@link IdentityContext} and returns the current user.
 *
 * @param injector - Injector carrying the identity to resolve.
 * @returns A promise resolving to the user, or rejecting if no user is bound.
 */
export const getCurrentUser = async (injector: Injector) => injector.get(IdentityContext).getCurrentUser()
