import { InMemoryStore, IPhysicalStore, IUser } from '@furystack/core'
import { Injectable, Injector } from '@furystack/inject'
import { sha256 } from 'hash.js'
/**
 * An user instance extended with a plain Password value
 */
export type ILoginUser<T extends IUser> = T & { Password: string }

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ ResolveDependencies: false })
export class HttpAuthenticationSettings<TUser extends IUser> {
  public Users: IPhysicalStore<ILoginUser<TUser>, any> = new InMemoryStore('Username')
  public Sessions: IPhysicalStore<{ SessionId: string; Username: string }> = new InMemoryStore('SessionId')
  public CookieName: string = 'fss'
  public HashMethod = (plain: string) =>
    sha256()
      .update(plain)
      .digest('hex')
  public VisitorUser = ({ Username: 'Visitor', Roles: [] } as unknown) as TUser
  public Injector: Injector = Injector.Default
  constructor(options?: Partial<HttpAuthenticationSettings<TUser>>) {
    Object.assign(this, options)
  }
}
