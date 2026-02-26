import { User } from '@furystack/core'
import type { Constructable, Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import { getDataSetFor } from '@furystack/repository'
import type { AuthenticationProvider } from './authentication-providers/authentication-provider.js'
import { DefaultSession } from './models/default-session.js'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends User, TSession extends DefaultSession> {
  public model: Constructable<TUser> = User as Constructable<TUser>

  public getUserDataSet = (injector: Injector) => getDataSetFor(injector, User, 'username')

  public getSessionDataSet: (injector: Injector) => DataSet<TSession, keyof TSession> = (injector) =>
    getDataSetFor(injector, DefaultSession, 'sessionId') as unknown as DataSet<TSession, keyof TSession>

  public cookieName = 'fss'
  public enableBasicAuth = true

  /**
   * Ordered list of authentication providers. Populated by {@link useHttpAuthentication}
   * and extended by `useJwtAuthentication()` or other auth plugins.
   * Safe to mutate only during setup, before the first request is served.
   */
  public authenticationProviders: AuthenticationProvider[] = []
}
