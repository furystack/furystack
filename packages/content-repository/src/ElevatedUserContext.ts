import { IUser, UserContext } from '@furystack/core'
import { Injectable, Injector } from '@furystack/inject'
import { Disposable } from '@sensenet/client-utils'
import { User } from './ContentTypes'
import { ISavedContent } from './models'
import { SystemContent } from './SystemContent'

/**
 * User context with a temporary elevation
 */
@Injectable()
export class ElevatedUserContext<TUser extends ISavedContent<IUser> = ISavedContent<User>>
  implements UserContext<TUser>, Disposable {
  private isDisposed: boolean = false

  public dispose() {
    this.isDisposed = true
  }

  public async GetCurrentUser(): Promise<TUser> {
    if (!this.isDisposed) {
      return (this.systemContent.AdminUser as any) as TUser
    }
    return (await this.injector.options.parent.GetInstance(UserContext).GetCurrentUser()) as TUser
  }
  constructor(private readonly systemContent: SystemContent, private readonly injector: Injector) {}

  public static Create<TUser extends ISavedContent<IUser> = ISavedContent<User>>(
    injector: Injector,
  ): ElevatedUserContext<TUser> {
    injector.Remove(ElevatedUserContext)
    const instance = injector.GetInstance<ElevatedUserContext<TUser>>(ElevatedUserContext, true)
    injector.SetInstance(instance, UserContext)
    return instance
  }
}
