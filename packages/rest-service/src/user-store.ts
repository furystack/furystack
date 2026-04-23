import { defineStore, type StoreToken, User } from '@furystack/core'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { DefaultSession } from './models/default-session.js'

/**
 * Error thrown by the default factories of {@link UserStore} and
 * {@link SessionStore} when they are resolved without a caller-provided
 * override. Users and sessions must outlive a process restart, so the
 * rest-service refuses to silently fall back to an in-memory store.
 */
export class HttpAuthenticationStoreNotConfiguredError extends Error {
  constructor(storeName: string) {
    super(
      `HTTP authentication store '${storeName}' has not been configured. Bind a persistent PhysicalStore before resolving the HttpUserContext.`,
    )
    this.name = 'HttpAuthenticationStoreNotConfiguredError'
  }
}

/**
 * Store token for persisted {@link User} records. Applications must bind
 * this token to a persistent implementation before resolving
 * {@link HttpUserContext} (or any service that derives from it).
 *
 * @example
 * ```ts
 * injector.bind(UserStore, () => myPersistentUserStore)
 * ```
 */
export const UserStore: StoreToken<User, 'username'> = defineStore({
  name: 'furystack/rest-service/UserStore',
  model: User,
  primaryKey: 'username',
  factory: () => {
    throw new HttpAuthenticationStoreNotConfiguredError('UserStore')
  },
})

/**
 * Store token for persisted {@link DefaultSession} records. Shares the
 * throw-by-default contract with {@link UserStore}.
 */
export const SessionStore: StoreToken<DefaultSession, 'sessionId'> = defineStore({
  name: 'furystack/rest-service/SessionStore',
  model: DefaultSession,
  primaryKey: 'sessionId',
  factory: () => {
    throw new HttpAuthenticationStoreNotConfiguredError('SessionStore')
  },
})

/**
 * Data set token over {@link UserStore}. Consumers of the authentication
 * subsystem (cookie login, JWT authentication plugins, `HttpUserContext`)
 * route all user I/O through this dataset.
 */
export const UserDataSet: DataSetToken<User, 'username'> = defineDataSet({
  name: 'furystack/rest-service/UserDataSet',
  store: UserStore,
})

/**
 * Data set token over {@link SessionStore}.
 */
export const SessionDataSet: DataSetToken<DefaultSession, 'sessionId'> = defineDataSet({
  name: 'furystack/rest-service/SessionDataSet',
  store: SessionStore,
})
