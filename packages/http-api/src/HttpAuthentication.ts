import { IUser } from '@furystack/core'
import { Injectable } from '@furystack/inject'
import { defaultHttpAuthenticationSettings, HttpAuthenticationSettings } from '.'

/**
 * Authentication class for the HTTP API
 */
@Injectable()
export class HttpAuthentication<TUser extends IUser> {
  public settings: HttpAuthenticationSettings<TUser> = defaultHttpAuthenticationSettings as HttpAuthenticationSettings<
    TUser
  >
  public setup(settings: Partial<HttpAuthenticationSettings<TUser>>) {
    this.settings = { ...this.settings, ...settings }
  }
}
