import type { Injector } from '@furystack/inject'
import { globalDisposables } from './global-disposables.js'
import { IdentityContext } from './identity-context.js'

/**
 * Registers `disposable` for shutdown. Returns the shared {@link globalDisposables}
 * set (same reference across calls — the return value is rarely useful).
 */
export const disposeOnProcessExit = (disposable: Disposable | AsyncDisposable): Set<Disposable | AsyncDisposable> =>
  globalDisposables.add(disposable)

/** Resolves {@link IdentityContext} on `injector` and forwards `isAuthenticated()`. */
export const isAuthenticated = async (injector: Injector): Promise<boolean> =>
  injector.get(IdentityContext).isAuthenticated()

/**
 * Resolves {@link IdentityContext} on `injector` and forwards `isAuthorized(...roles)`.
 * Returns `true` only when the user holds **every** role.
 */
export const isAuthorized = async (injector: Injector, ...roles: string[]): Promise<boolean> =>
  injector.get(IdentityContext).isAuthorized(...roles)

/**
 * Resolves {@link IdentityContext} on `injector` and forwards `getCurrentUser()`.
 * Rejects when no user is bound (the default unauthenticated context).
 */
export const getCurrentUser = async (injector: Injector) => injector.get(IdentityContext).getCurrentUser()
