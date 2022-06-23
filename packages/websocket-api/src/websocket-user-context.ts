import { IncomingMessage } from 'http'
import { IdentityContext, User } from '@furystack/core'
import { Injectable, Injected, Injector } from '@furystack/inject'
import { HttpUserContext } from '@furystack/rest-service'

@Injectable({ lifetime: 'scoped' })
export class WebsocketUserContext implements IdentityContext {
  public async isAuthenticated(): Promise<boolean> {
    try {
      return (await this.getCurrentUser()) ? true : false
    } catch (error) {
      return false
    }
  }
  public async isAuthorized(...roles: string[]): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser()
      for (const role of roles) {
        if (!currentUser || !currentUser.roles.some((c) => c === role)) {
          return false
        }
      }
      return true
    } catch (error) {
      return false
    }
  }
  public async getCurrentUser<TUser extends User>(): Promise<TUser> {
    const user = await this.injector
      .getInstance(HttpUserContext)
      .authenticateRequest(this.injector.getInstance(IncomingMessage))
    return user as TUser
  }

  @Injected(Injector)
  private readonly injector!: Injector
}
