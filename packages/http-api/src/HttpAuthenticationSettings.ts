import { InMemoryStore, IPhysicalStore, IUser } from '@furystack/core'
import { StoreManager } from '@furystack/core/dist/StoreManager'
import { Injectable } from '@furystack/inject'
import { sha256 } from 'hash.js'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends IUser = IUser> {
  public getUserStore: (storeManager: StoreManager) => IPhysicalStore<TUser> = () =>
    new InMemoryStore<TUser>('username')
  public sessions: IPhysicalStore<{ SessionId: string; Username: string }> = new InMemoryStore('SessionId')
  public cookieName: string = 'fss'
  public hashMethod: (plain: string) => string = plain =>
    sha256()
      .update(plain)
      .digest('hex')
  public visitorUser: TUser = ({ username: 'Visitor', roles: [] } as any) as TUser
}
