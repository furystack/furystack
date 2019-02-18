import { InMemoryStore, IPhysicalStore, IUser } from '@furystack/core'
import { sha256 } from 'hash.js'
/**
 * An user instance extended with a plain Password value
 */
export type ILoginUser<T extends IUser> = T & { password: string }

/**
 * Authentication settings object for FuryStack HTTP Api
 */
export interface HttpAuthenticationSettings<TUser extends IUser = IUser> {
  users: IPhysicalStore<ILoginUser<TUser>, any> // = new InMemoryStore('username')
  sessions: IPhysicalStore<{ SessionId: string; Username: string }> // = new InMemoryStore('SessionId')
  cookieName: string // = 'fss'
  hashMethod: (plain: string) => string
  visitorUser: TUser // =
}

/**
 * Default HTTP authentication settings
 */
export const defaultHttpAuthenticationSettings: HttpAuthenticationSettings = {
  users: new InMemoryStore('username'),
  sessions: new InMemoryStore('SessionId'),
  cookieName: 'fss',
  hashMethod: plain =>
    sha256()
      .update(plain)
      .digest('hex'),
  visitorUser: { username: 'Visitor', roles: [] },
}
