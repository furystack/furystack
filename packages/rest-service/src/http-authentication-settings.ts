import type { PhysicalStore, StoreManager } from '@furystack/core'
import { User } from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import type { AuthenticationProvider } from './authentication-providers/authentication-provider.js'
import { DefaultSession } from './models/default-session.js'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends User, TSession extends DefaultSession> {
  public model: Constructable<TUser> = User as Constructable<TUser>

  public getUserStore = (sm: StoreManager) => sm.getStoreFor(User, 'username')

  public getSessionStore: (storeManager: StoreManager) => PhysicalStore<TSession, keyof TSession> = (sm) =>
    sm.getStoreFor(DefaultSession, 'sessionId') as unknown as PhysicalStore<TSession, keyof TSession>

  public cookieName = 'fss'
  public enableBasicAuth = true

  /**
   * Ordered list of authentication providers. Populated by {@link useHttpAuthentication}
   * and extended by `useJwtAuthentication()` or other auth plugins.
   * Safe to mutate only during setup, before the first request is served.
   */
  public authenticationProviders: AuthenticationProvider[] = []
}
