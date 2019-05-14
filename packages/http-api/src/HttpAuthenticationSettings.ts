import { IPhysicalStore, User } from '@furystack/core'
import { StoreManager } from '@furystack/core/dist/StoreManager'
import { Constructable, Injectable } from '@furystack/inject'
import { sha256 } from 'hash.js'
import { DefaultSession } from './Models/DefaultSession'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends User> {
  public model: Constructable<TUser> = User as Constructable<TUser>

  public getUserStore: (storeManager: StoreManager) => IPhysicalStore<TUser> = sm =>
    sm.getStoreFor<TUser>(User as Constructable<TUser>)

  public getSessionStore: (storeManager: StoreManager) => IPhysicalStore<DefaultSession> = sm =>
    sm.getStoreFor(DefaultSession)

  public cookieName: string = 'fss'
  public hashMethod: (plain: string) => string = plain =>
    sha256()
      .update(plain)
      .digest('hex')
  public visitorUser: TUser = ({ username: 'Visitor', roles: [] } as any) as TUser
}
