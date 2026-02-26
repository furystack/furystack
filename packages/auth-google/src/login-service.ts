import type { User } from '@furystack/core'
import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import { HttpAuthenticationSettings } from '@furystack/rest-service'
import { OAuth2Client } from 'google-auth-library'
import type { TokenPayload } from 'google-auth-library'

/**
 * Service for Google OAuth authentication.
 *
 * Verifies Google ID tokens locally using the `google-auth-library`
 * (JWT signature, `aud`, `iss`, `exp` checks) and resolves the
 * corresponding local user.
 *
 * `clientId` is required and must be set via {@link useGoogleAuthentication}
 * before the first login request is served.
 */
@Injectable({ lifetime: 'explicit' })
export class GoogleLoginService {
  /**
   * Google OAuth Client ID used for audience (`aud`) validation.
   * Must match the client ID used on the frontend.
   */
  public clientId!: string

  /**
   * When true, the login action validates the `g_csrf_token`
   * double-submit cookie sent by Google Identity Services.
   */
  public enableCsrfCheck = false

  @Injected((injector: Injector) => useSystemIdentityContext({ injector, username: 'GoogleLoginService' }))
  declare private readonly systemInjector: Injector

  @Injected((injector: Injector) => injector.getInstance(HttpAuthenticationSettings).getUserDataSet(injector))
  declare private readonly userDataSet: DataSet<User, 'username'>

  /**
   * Verifies a Google ID token and returns the decoded payload.
   *
   * @param token The Google ID token string
   * @returns The verified token payload
   */
  public async getGoogleUserData(token: string): Promise<TokenPayload> {
    const client = new OAuth2Client()
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: this.clientId,
    })
    const payload = ticket.getPayload()
    if (!payload) {
      throw new Error('Failed to get payload from Google ID token.')
    }
    return payload
  }

  /**
   * Resolves a local {@link User} from the verified Google token payload.
   * Override to customise user lookup or provisioning.
   *
   * The default implementation requires `email_verified` and looks up
   * the user by `email` in the configured User DataSet.
   *
   * @param payload The verified Google ID token payload
   * @returns The matching user, or `undefined` if not found
   */
  public getUserFromGooglePayload: (payload: TokenPayload) => Promise<User | undefined> = async (payload) => {
    if (!payload.email_verified) {
      throw new Error('Google email is not verified.')
    }
    const users = await this.userDataSet.find(this.systemInjector, {
      top: 2,
      filter: {
        username: { $eq: payload.email! },
      },
    })
    if (users.length === 1) {
      return users[0]
    }
  }
}
