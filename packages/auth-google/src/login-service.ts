import type { User } from '@furystack/core'
import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { HttpAuthenticationSettings } from '@furystack/rest-service'
import { OAuth2Client, type TokenPayload } from 'google-auth-library'

import { GoogleAuthenticationSettings } from './google-authentication-settings.js'

/**
 * Service for Google OAuth authentication.
 *
 * Verifies Google ID tokens locally using the `google-auth-library`
 * (JWT signature, `aud`, `iss`, `exp` checks) and resolves the
 * corresponding local user.
 *
 * Applications configure the service via {@link useGoogleAuthentication},
 * which binds the {@link GoogleAuthenticationSettings} token on the injector.
 */
export interface GoogleLoginService {
  /** The Google OAuth Client ID used for audience validation. */
  readonly clientId: string
  /** Whether the CSRF double-submit cookie check is enabled. */
  readonly enableCsrfCheck: boolean
  /**
   * Verifies a Google ID token and returns the decoded payload.
   *
   * @param token The Google ID token string
   * @returns The verified token payload
   */
  getGoogleUserData(token: string): Promise<TokenPayload>
  /**
   * Resolves a local {@link User} from the verified Google token payload.
   *
   * The default implementation requires `email_verified` and looks up the
   * user by `email` in the configured user dataset.
   *
   * @param payload The verified Google ID token payload
   * @returns The matching user, or `undefined` if not found
   */
  getUserFromGooglePayload(payload: TokenPayload): Promise<User | undefined>
}

/**
 * DI token for the singleton {@link GoogleLoginService}. The factory resolves
 * {@link GoogleAuthenticationSettings} and {@link HttpAuthenticationSettings},
 * creates a system-identity child scope for user lookups, registers
 * `onDispose` teardown for that scope and instantiates a single
 * {@link OAuth2Client} reused across token verifications.
 */
export const GoogleLoginService: Token<GoogleLoginService, 'singleton'> = defineService({
  name: 'furystack/auth-google/GoogleLoginService',
  lifetime: 'singleton',
  factory: ({ inject, injector, onDispose }): GoogleLoginService => {
    const settings = inject(GoogleAuthenticationSettings)
    const httpAuthSettings = inject(HttpAuthenticationSettings)
    const systemInjector = useSystemIdentityContext({ injector, username: 'GoogleLoginService' })
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    const oauthClient = new OAuth2Client()

    const getGoogleUserData = async (token: string): Promise<TokenPayload> => {
      const ticket = await oauthClient.verifyIdToken({
        idToken: token,
        audience: settings.clientId,
      })
      const payload = ticket.getPayload()
      if (!payload) {
        throw new Error('Failed to get payload from Google ID token.')
      }
      return payload
    }

    const defaultUserResolver = async (payload: TokenPayload): Promise<User | undefined> => {
      if (!payload.email_verified) {
        throw new Error('Google email is not verified.')
      }
      if (!payload.email) {
        throw new Error('Google token does not contain an email address.')
      }
      const userDataSet = systemInjector.get(httpAuthSettings.userDataSet)
      const users = await userDataSet.find(systemInjector, {
        top: 2,
        filter: { username: { $eq: payload.email } },
      })
      if (users.length === 1) {
        return users[0]
      }
      return undefined
    }

    const getUserFromGooglePayload = settings.getUserFromGooglePayload ?? defaultUserResolver

    return {
      clientId: settings.clientId,
      enableCsrfCheck: settings.enableCsrfCheck,
      getGoogleUserData,
      getUserFromGooglePayload,
    }
  },
})
