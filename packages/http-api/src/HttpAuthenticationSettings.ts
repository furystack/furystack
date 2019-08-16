import { PhysicalStore, User, StoreManager } from '@furystack/core'
import { Constructable, Injectable } from '@furystack/inject'
import { sha256 } from 'hash.js'
import { DefaultSession } from './Models/DefaultSession'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends User> {
  public model: Constructable<TUser> = User as Constructable<TUser>

  public getUserStore: (storeManager: StoreManager) => PhysicalStore<TUser & { password: string }> = sm =>
    sm.getStoreFor<TUser & { password: string }>(User as Constructable<TUser & { password: string }>)

  public getSessionStore: (storeManager: StoreManager) => PhysicalStore<DefaultSession> = sm =>
    sm.getStoreFor(DefaultSession)

  public cookieName = 'fss'
  public hashMethod: (plain: string) => string = plain =>
    sha256()
      .update(plain)
      .digest('hex')
  public visitorUser: TUser = ({ username: 'Visitor', roles: [] } as any) as TUser

  public enableBasicAuth = true
}
