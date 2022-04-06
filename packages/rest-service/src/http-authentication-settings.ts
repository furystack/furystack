import { PhysicalStore, User, StoreManager } from '@furystack/core'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { HealthCheckable, HealthCheckResult } from '@furystack/utils'
import { DefaultSession } from './models/default-session'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends User, TSession extends DefaultSession>
  implements HealthCheckable
{
  public async checkHealth(): Promise<HealthCheckResult> {
    const storeManager = this.injector.getInstance(StoreManager)
    try {
      this.getUserStore(storeManager)
    } catch (error) {
      return {
        healthy: 'unhealthy',
        reason: {
          message: 'Failed to get user store',
          error,
        },
      }
    }
    try {
      this.getSessionStore(storeManager)
    } catch (error) {
      return {
        healthy: 'unhealthy',
        reason: {
          message: 'Failed to get session store',
          error,
        },
      }
    }
    return {
      healthy: 'healthy',
    }
  }
  public model: Constructable<TUser> = User as Constructable<TUser>

  public getUserStore: (storeManager: StoreManager) => PhysicalStore<TUser, keyof TUser> = (sm) =>
    sm.getStoreFor<TUser, keyof TUser>(User as any, 'username')

  public getSessionStore: (storeManager: StoreManager) => PhysicalStore<TSession, keyof TSession> = (sm) =>
    sm.getStoreFor(DefaultSession, 'sessionId') as unknown as PhysicalStore<TSession, keyof TSession>

  public cookieName = 'fss'
  public enableBasicAuth = true

  constructor(private readonly injector: Injector) {}
}
