import { PhysicalStore, User, StoreManager } from '@furystack/core'
import { Constructable, Injectable } from '@furystack/inject'
import { sha256 } from 'hash.js'
import { DefaultSession } from './models/default-session'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends User, TSession extends DefaultSession> {
  public model: Constructable<TUser> = User as Constructable<TUser>

  public getUserStore: (storeManager: StoreManager) => PhysicalStore<TUser & { password: string }, keyof TUser> = (
    sm,
  ) => sm.getStoreFor<TUser & { password: string }, keyof TUser>(User as any, 'username')

  public getSessionStore: (storeManager: StoreManager) => PhysicalStore<TSession, keyof TSession> = (sm) =>
    sm.getStoreFor(DefaultSession, 'sessionId') as unknown as PhysicalStore<TSession, keyof TSession>

  public cookieName = 'fss'
  public hashMethod: (plain: string) => string = (plain) => sha256().update(plain).digest('hex')
  public enableBasicAuth = true
}
