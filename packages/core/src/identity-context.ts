import { Injectable } from '@furystack/inject'
import type { User } from './models/user'

@Injectable({ lifetime: 'scoped' })
export class IdentityContext {
  public async isAuthenticated() {
    return false
  }

  public async isAuthorized(..._roles: string[]) {
    return false
  }

  public async getCurrentUser<TUser extends User>(): Promise<TUser> {
    throw Error('No IdentityContext')
  }
}
