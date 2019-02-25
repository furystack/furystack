import { InMemoryStore, IPhysicalStore, IUser } from '@furystack/core'
import { sha256 } from 'hash.js'
/**
 * An user instance extended with a plain Password value
 */
export type ILoginUser<T extends IUser> = T & { password: string }

/**
 * Authentication settings object for FuryStack HTTP Api
 */
export class HttpAuthenticationSettings<TUser extends IUser = IUser> {
  public users: IPhysicalStore<ILoginUser<TUser>, any> = new InMemoryStore('username')
  public sessions: IPhysicalStore<{ SessionId: string; Username: string }> = new InMemoryStore('SessionId')
  public cookieName: string = 'fss'
  public hashMethod: (plain: string) => string = plain =>
    sha256()
      .update(plain)
      .digest('hex')
  public visitorUser: TUser = ({ username: 'Visitor', roles: [] } as any) as TUser
}
