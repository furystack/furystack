import { get } from 'https'
import { User, StoreManager } from '@furystack/core'
import { ExternalLoginService, HttpAuthenticationSettings } from '@furystack/http-api'
import { Utils } from '@furystack/http-api/dist/Utils'
import { Injectable, Injector } from '@furystack/inject'

/**
 * Payload model from Google
 */
export interface GoogleApiPayload {
  // issuer
  iss: string
  // Unique Google Identifier
  sub: number
  // E-mail address
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name: string
  family_name: string
  locale: string
}

@Injectable({ lifetime: 'singleton' })
export class GoogleLoginSettings {
  public getUserFromGooglePayload: (
    payload: GoogleApiPayload,
    injector: Injector,
  ) => Promise<User | undefined> = async (payload, injector) => {
    if (!payload.email_verified) {
      return undefined
    }
    const userStore = injector.getInstance(HttpAuthenticationSettings).getUserStore(injector.getInstance(StoreManager))
    const users = await userStore.search({
      top: 2,
      filter: {
        username: payload.email,
      },
    })
    if (users.length === 1) {
      return users[0]
    }
  }
}

/**
 * Service class for Google OAuth authentication
 */
@Injectable({ lifetime: 'transient' })
export class GoogleLoginService implements ExternalLoginService {
  /**
   *
   */
  constructor(
    private readonly settings: GoogleLoginSettings,
    private readonly utils: Utils,
    private injector: Injector,
  ) {}
  private readonly googleApiEndpoint: string = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='

  /**
   * Returns the extracted Google Authentication data from the token.
   * @param token
   */
  public async getGoogleUserData(token: string): Promise<GoogleApiPayload> {
    return await new Promise<GoogleApiPayload>((resolve, reject) =>
      get(`${this.googleApiEndpoint}${token}`, async response => {
        if (response.statusCode && response.statusCode < 400) {
          const body = await this.utils.readPostBody<GoogleApiPayload>(response)
          resolve(body)
        } else {
          reject({ ...response })
        }
      }),
    )
  }

  /**
   * Authenticates the user with an IdToken and returns a user. The user will be inserted to the DataStore if not present.
   * @param token The IdToken to authenticate
   */
  public async login(token: string): Promise<User> {
    const googleData = await this.getGoogleUserData(token)
    const user = await this.settings.getUserFromGooglePayload(googleData, this.injector)
    if (!user) {
      throw Error(`Attached user not found.`)
    }
    return user
  }
}
