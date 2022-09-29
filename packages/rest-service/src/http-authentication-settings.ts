import type { PhysicalStore, StoreManager } from '@furystack/core'
import { User } from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { DefaultSession } from './models/default-session'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends User, TSession extends DefaultSession> {
  public model: Constructable<TUser> = User as Constructable<TUser>

  public getUserStore: (storeManager: StoreManager) => PhysicalStore<TUser, keyof TUser> = (sm) =>
    sm.getStoreFor<TUser, keyof TUser>(User as any, 'username')

  public getSessionStore: (storeManager: StoreManager) => PhysicalStore<TSession, keyof TSession> = (sm) =>
    sm.getStoreFor(DefaultSession, 'sessionId') as unknown as PhysicalStore<TSession, keyof TSession>

  public cookieName = 'fss'
  public enableBasicAuth = true
}
