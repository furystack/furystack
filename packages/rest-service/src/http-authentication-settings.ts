import type { User } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import type { DataSetToken } from '@furystack/repository'
import type { AuthenticationProvider } from './authentication-providers/authentication-provider.js'
import type { DefaultSession } from './models/default-session.js'
import { SessionDataSet, UserDataSet } from './user-store.js'

/**
 * HTTP-authentication settings — rebound by {@link useHttpAuthentication}
 * during application setup and consumed by {@link HttpUserContext},
 * cookie-login strategies and OpenAPI generators.
 *
 * The field shape reflects the functional-DI redesign:
 *
 * - `userDataSet` / `sessionDataSet` are token references (not accessors).
 *   Consumers resolve them through the injector at the appropriate scope.
 * - `authenticationProviders` is a simple ordered list; `HttpUserContext`
 *   walks it on every unauthenticated request.
 */
export interface HttpAuthenticationSettings {
  /** Data set token for user lookups. */
  userDataSet: DataSetToken<User, 'username'>
  /** Data set token for session lookups. */
  sessionDataSet: DataSetToken<DefaultSession, 'sessionId'>
  /** Cookie name used by the built-in cookie-auth provider. */
  cookieName: string
  /** Whether the built-in Basic Auth provider is installed by {@link useHttpAuthentication}. */
  enableBasicAuth: boolean
  /**
   * Ordered list of authentication providers. Populated during
   * {@link useHttpAuthentication} and extended by plugins such as
   * `useJwtAuthentication`.
   */
  authenticationProviders: AuthenticationProvider[]
}

/**
 * Returns a fresh copy of the default {@link HttpAuthenticationSettings}.
 * Used as the starting point inside {@link useHttpAuthentication}.
 */
export const defaultHttpAuthenticationSettings = (): HttpAuthenticationSettings => ({
  userDataSet: UserDataSet,
  sessionDataSet: SessionDataSet,
  cookieName: 'fss',
  enableBasicAuth: true,
  authenticationProviders: [],
})

/**
 * DI token carrying the current {@link HttpAuthenticationSettings}. Rebind
 * via {@link useHttpAuthentication} (preferred) or directly through
 * {@link Injector.bind} for advanced scenarios.
 */
export const HttpAuthenticationSettings: Token<HttpAuthenticationSettings, 'singleton'> = defineService({
  name: 'furystack/rest-service/HttpAuthenticationSettings',
  lifetime: 'singleton',
  factory: () => defaultHttpAuthenticationSettings(),
})
