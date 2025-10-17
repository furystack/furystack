import type { Injector } from '@furystack/inject'
import { globalDisposables } from './global-disposables.js'
import { IdentityContext } from './identity-context.js'
import type { PhysicalStore } from './models/physical-store.js'
import { StoreManager } from './store-manager.js'

/**
 * The disposable will be disposed on process exit
 * @param disposable The Disposable object to dispose on process exit
 * @returns A set of global disposables
 */
export const disposeOnProcessExit = (disposable: Disposable | AsyncDisposable) => globalDisposables.add(disposable)

/**
 *  @param injector The Injector instance
 *  @returns the current authentication status from the identity context
 */
export const isAuthenticated = async (injector: Injector) => injector.getInstance(IdentityContext).isAuthenticated()

/**
 * @param injector The Injector instance
 * @param roles A list of roles
 * @returns whether the user is authorized with the specified roles from the identity context
 */
export const isAuthorized = async (injector: Injector, ...roles: string[]) =>
  injector.getInstance(IdentityContext).isAuthorized(...roles)

/**
 * @param injector The Injector instance
 * @returns The current user from the identity context
 */
export const getCurrentUser = async (injector: Injector) => injector.getInstance(IdentityContext).getCurrentUser()

/**
 * @param injector The Injector instance
 * @returns A Store Manager instance to setup stores
 */
export const getStoreManager = (injector: Injector) => injector.getInstance(StoreManager)

/**
 *
 * @param injector The Injector instance
 * @param store The store to add
 * @returns The Store Manager instance for chaining
 */
export const addStore = <T, TPrimaryKey extends keyof T>(injector: Injector, store: PhysicalStore<T, TPrimaryKey>) =>
  getStoreManager(injector).addStore(store)
