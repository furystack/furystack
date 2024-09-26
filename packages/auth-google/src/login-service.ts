import type { PhysicalStore, User } from '@furystack/core'
import { StoreManager } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { HttpAuthenticationSettings, readPostBody } from '@furystack/rest-service'
import { get } from 'https'

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

  @Injected((injector) =>
    injector.getInstance(HttpAuthenticationSettings).getUserStore(injector.getInstance(StoreManager)),
  )
  private declare readonly userStore: PhysicalStore<User, 'username'>

  public getUserFromGooglePayload: (payload: GoogleApiPayload) => Promise<User | undefined> = async (payload) => {
    const users = await this.userStore.find({
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
@Injectable({ lifetime: 'scoped' })
export class GoogleLoginService {
  @Injected(GoogleLoginSettings)
  private declare readonly settings: GoogleLoginSettings

  private readonly googleApiEndpoint: string = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='

  public readPostBody = readPostBody

  /**
   * @param token The ID Token
   * @returns the extracted Google Authentication data from the token.
   */
  public async getGoogleUserData(token: string): Promise<GoogleApiPayload> {
    return await new Promise<GoogleApiPayload>((resolve, reject) =>
      this.settings.get(`${this.googleApiEndpoint}${token}`, (response) => {
        if (response.statusCode && response.statusCode < 400) {
          this.readPostBody<GoogleApiPayload>(response).then(resolve).catch(reject)
        } else {
          reject(new Error('Invalid response!'))
        }
      }),
    )
  }

  /**
   * Authenticates the user with an IdToken and returns a user. The user will be inserted to the DataStore if not present.
   * @param token The IdToken to authenticate
   * @returns The current user
   */
  public async login(token: string): Promise<User> {
    const googleData = await this.getGoogleUserData(token)
    const user = await this.settings.getUserFromGooglePayload(googleData)
    if (!user) {
      throw Error(`Attached user not found.`)
    }
    return user
  }
}
