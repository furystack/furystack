import { get } from 'https'
import { User, visitorUser } from '@furystack/core'
import { ExternalLoginService, HttpUserContext } from '@furystack/http-api'
import { Utils } from '@furystack/http-api/dist/Utils'
import { Injectable } from '@furystack/inject'

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

/**
 * Service class for Google OAuth authentication
 */
@Injectable({ lifetime: 'transient' })
export class GoogleLoginService<TUser extends User & { googleId: number; googleProfileData: GoogleApiPayload }>
  implements ExternalLoginService<TUser, [string]> {
  /**
   *
   */
  constructor(private readonly userContext: HttpUserContext<TUser>, private readonly utils: Utils) {}
  private readonly googleApiEndpoint: string = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='

  /**
   * Authenticates the user with an IdToken and returns a user. The user will be inserted to the DataStore if not present.
   * @param token The IdToken to authenticate
   */
  public async login(token: string): Promise<TUser> {
    try {
      return await new Promise<TUser>((resolve, reject) =>
        get(`${this.googleApiEndpoint}${token}`, async response => {
          if (response.statusCode && response.statusCode < 400) {
            const body = await this.utils.readPostBody<GoogleApiPayload>(response)
            const users = await this.userContext.users.filter({
              // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
              filter: {
                googleId: body.sub,
              } as Partial<TUser>,
            })

            if (users.length === 0) {
              // User not found, let's create it...
              const user = await this.userContext.users.add(({
                username: body.name,
                googleId: body.sub,
                roles: [],
                password: '',
                googleProfileData: body,
              } as any) as TUser)
              resolve(user)
            } else if (users.length === 1) {
              resolve(users[0])
            } else {
              resolve(visitorUser as TUser)
            }
          } else {
            reject({ ...response })
          }
        }),
      )
    } catch (error) {
      /** */
    }

    return visitorUser as TUser
  }
}
