import { InMemoryStore, IPhysicalStore, IUser } from '@furystack/core'
import { Injectable, Injector } from '@furystack/inject'
import { sha256 } from 'hash.js'
/**
 * An user instance extended with a plain Password value
 */
export type ILoginUser<T extends IUser> = T & { password: string }

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ ResolveDependencies: false })
export class HttpAuthenticationSettings<TUser extends IUser> {
  public users: IPhysicalStore<ILoginUser<TUser>, any> = new InMemoryStore('username')
  public sessions: IPhysicalStore<{ SessionId: string; Username: string }> = new InMemoryStore('SessionId')
  public cookieName: string = 'fss'
  public hashMethod = (plain: string) =>
    sha256()
      .update(plain)
      .digest('hex')
  public visitorUser = ({ username: 'Visitor', roles: [] } as unknown) as TUser
  public injector: Injector = Injector.default
  constructor(options?: Partial<HttpAuthenticationSettings<TUser>>) {
    Object.assign(this, options)
  }
}
