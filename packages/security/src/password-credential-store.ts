import { defineStore, type StoreToken } from '@furystack/core'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { PasswordCredential } from './models/password-credential.js'
import { PasswordResetToken } from './models/password-reset-token.js'

/**
 * Error thrown by the default factories of {@link PasswordCredentialStore}
 * and {@link PasswordResetTokenStore} when they are resolved without a
 * caller-provided override.
 *
 * Password credentials and reset tokens **must** survive process restarts,
 * so security refuses to fall back to an in-memory store. Applications
 * must bind a persistent implementation before resolving the
 * {@link PasswordAuthenticator}.
 */
export class SecurityStoreNotConfiguredError extends Error {
  constructor(storeName: string) {
    super(
      `Security store '${storeName}' has not been configured. Bind a persistent PhysicalStore for ${storeName} before resolving the PasswordAuthenticator.`,
    )
    this.name = 'SecurityStoreNotConfiguredError'
  }
}

/**
 * Store token for persisted {@link PasswordCredential} records. The default
 * factory deliberately throws — applications are expected to rebind this
 * token on their root injector with a persistent backing store before
 * resolving any service that depends on it.
 *
 * @example
 * ```ts
 * injector.bind(PasswordCredentialStore, () => myPersistentCredentialStore)
 * ```
 */
export const PasswordCredentialStore: StoreToken<PasswordCredential, 'userName'> = defineStore({
  name: 'furystack/security/PasswordCredentialStore',
  model: PasswordCredential,
  primaryKey: 'userName',
  factory: () => {
    throw new SecurityStoreNotConfiguredError('PasswordCredentialStore')
  },
})

/**
 * Store token for persisted {@link PasswordResetToken} records. Shares the
 * throw-by-default contract with {@link PasswordCredentialStore}.
 *
 * @example
 * ```ts
 * injector.bind(PasswordResetTokenStore, () => myPersistentTokenStore)
 * ```
 */
export const PasswordResetTokenStore: StoreToken<PasswordResetToken, 'token'> = defineStore({
  name: 'furystack/security/PasswordResetTokenStore',
  model: PasswordResetToken,
  primaryKey: 'token',
  factory: () => {
    throw new SecurityStoreNotConfiguredError('PasswordResetTokenStore')
  },
})

/**
 * Data set token over {@link PasswordCredentialStore}. The security services
 * route all credential I/O through this dataset so authorization, hooks and
 * change events can be layered on top of the raw store.
 */
export const PasswordCredentialDataSet: DataSetToken<PasswordCredential, 'userName'> = defineDataSet({
  name: 'furystack/security/PasswordCredentialDataSet',
  store: PasswordCredentialStore,
})

/**
 * Data set token over {@link PasswordResetTokenStore}.
 */
export const PasswordResetTokenDataSet: DataSetToken<PasswordResetToken, 'token'> = defineDataSet({
  name: 'furystack/security/PasswordResetTokenDataSet',
  store: PasswordResetTokenStore,
})
