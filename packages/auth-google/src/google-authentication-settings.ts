import type { User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineService, type Token } from '@furystack/inject'
import type { HttpAuthenticationSettings } from '@furystack/rest-service'
import type { TokenPayload } from 'google-auth-library'

import type { useGoogleAuthentication } from './helpers.js'
import type { GoogleLoginService } from './login-service.js'

/**
 * Configuration for Google OAuth authentication. Rebound by
 * {@link useGoogleAuthentication} during application setup and consumed by
 * the {@link GoogleLoginService} factory.
 *
 * `getUserFromGooglePayload` can be overridden to customise how a verified
 * Google token payload is mapped onto a local {@link User}. The default
 * implementation requires `email_verified` and looks up the user by `email`
 * in the {@link HttpAuthenticationSettings#userDataSet}.
 */
export interface GoogleAuthenticationSettings {
  /**
   * Google OAuth Client ID used for audience (`aud`) validation. Must match
   * the client ID used on the frontend.
   */
  clientId: string
  /**
   * When `true`, the login action validates the `g_csrf_token` double-submit
   * cookie sent by Google Identity Services.
   */
  enableCsrfCheck: boolean
  /**
   * Optional hook for resolving the local user from the verified token
   * payload. When omitted, the {@link GoogleLoginService} factory installs a
   * default implementation that looks up the user by `email` in the
   * configured user dataset.
   */
  getUserFromGooglePayload?: (payload: TokenPayload) => Promise<User | undefined>
}

/**
 * Returns a fresh copy of the {@link GoogleAuthenticationSettings} defaults
 * except for `clientId`, which must be supplied by the caller via
 * {@link useGoogleAuthentication}.
 */
export const defaultGoogleAuthenticationSettings = (): Omit<GoogleAuthenticationSettings, 'clientId'> => ({
  enableCsrfCheck: false,
})

/**
 * Error thrown by the default {@link GoogleAuthenticationSettings} factory
 * when it is resolved without first calling {@link useGoogleAuthentication}.
 */
export class GoogleAuthenticationNotConfiguredError extends Error {
  constructor() {
    super(
      'GoogleAuthenticationSettings has not been configured. Call useGoogleAuthentication(injector, { clientId, ... }) before resolving GoogleLoginService.',
    )
    this.name = 'GoogleAuthenticationNotConfiguredError'
  }
}

/**
 * DI token carrying the current {@link GoogleAuthenticationSettings}. The
 * default factory throws — bind via {@link useGoogleAuthentication} or
 * {@link Injector.bind} before resolving the {@link GoogleLoginService}.
 */
export const GoogleAuthenticationSettings: Token<GoogleAuthenticationSettings, 'singleton'> = defineService({
  name: 'furystack/auth-google/GoogleAuthenticationSettings',
  lifetime: 'singleton',
  factory: () => {
    throw new GoogleAuthenticationNotConfiguredError()
  },
})
