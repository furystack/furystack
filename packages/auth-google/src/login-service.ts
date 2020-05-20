import { get } from 'https'
import { User, StoreManager } from '@furystack/core'
import { HttpAuthenticationSettings, Utils } from '@furystack/rest-service'
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
  public get = get

  public getUserFromGooglePayload: (
    payload: GoogleApiPayload,
    injector: Injector,
  ) => Promise<User | undefined> = async (payload, injector) => {
    const userStore = injector.getInstance(HttpAuthenticationSettings).getUserStore(injector.getInstance(StoreManager))
    const users = await userStore.find({
      top: 2,
      filter: {
        username: { $eq: payload.email },
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
export class GoogleLoginService {
  constructor(
    private readonly settings: GoogleLoginSettings,
    public readonly utils: Utils,
    private injector: Injector,
  ) {}
  private readonly googleApiEndpoint: string = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='

  /**
   * @param token The ID Token
   * @returns the extracted Google Authentication data from the token.
   */
  public async getGoogleUserData(token: string): Promise<GoogleApiPayload> {
    return await new Promise<GoogleApiPayload>((resolve, reject) =>
      this.settings.get(`${this.googleApiEndpoint}${token}`, async (response) => {
        if (response.statusCode && response.statusCode < 400) {
          const body = await this.utils.readPostBody<GoogleApiPayload>(response)
          return resolve(body)
        } else {
          return reject(new Error('Invalid response!'))
        }
      }),
    )
  }

  /**
   * Authenticates the user with an IdToken and returns a user. The user will be inserted to the DataStore if not present.
   *
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
