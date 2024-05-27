import { Injectable } from '@furystack/inject'
import type { User } from './models/user.js'

@Injectable({ lifetime: 'scoped' })
export class IdentityContext {
  public isAuthenticated() {
    return Promise.resolve(false)
  }

  public isAuthorized(..._roles: string[]) {
    return Promise.resolve(false)
  }

  public getCurrentUser<TUser extends User>(): Promise<TUser> {
    throw new Error('No IdentityContext')
  }
}
