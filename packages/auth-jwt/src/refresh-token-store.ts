import { defineStore, type StoreToken } from '@furystack/core'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { RefreshToken } from './models/refresh-token.js'

/**
 * Error thrown by the default factory of {@link RefreshTokenStore} when it is
 * resolved without a caller-provided override.
 *
 * JWT refresh tokens must survive process restarts, so auth-jwt refuses to
 * fall back to an in-memory store. Applications must bind a persistent
 * implementation before resolving the {@link JwtTokenService}.
 */
export class JwtStoreNotConfiguredError extends Error {
  constructor(storeName: string) {
    super(
      `Auth-JWT store '${storeName}' has not been configured. Bind a persistent PhysicalStore for ${storeName} before resolving the JwtTokenService.`,
    )
    this.name = 'JwtStoreNotConfiguredError'
  }
}

/**
 * Store token for persisted {@link RefreshToken} records. The default factory
 * throws on purpose — applications are expected to rebind this token on their
 * root injector with a persistent backing store before resolving any service
 * that depends on it.
 *
 * @example
 * ```ts
 * injector.bind(RefreshTokenStore, () => myPersistentRefreshTokenStore)
 * ```
 */
export const RefreshTokenStore: StoreToken<RefreshToken, 'token'> = defineStore({
  name: 'furystack/auth-jwt/RefreshTokenStore',
  model: RefreshToken,
  primaryKey: 'token',
  factory: () => {
    throw new JwtStoreNotConfiguredError('RefreshTokenStore')
  },
})

/**
 * Data set token over {@link RefreshTokenStore}. The {@link JwtTokenService}
 * routes all refresh-token I/O through this dataset so authorization hooks
 * and change events can be layered on top of the raw store.
 */
export const RefreshTokenDataSet: DataSetToken<RefreshToken, 'token'> = defineDataSet({
  name: 'furystack/auth-jwt/RefreshTokenDataSet',
  store: RefreshTokenStore,
})
