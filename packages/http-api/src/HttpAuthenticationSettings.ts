import { InMemoryStore, IPhysicalStore, User } from '@furystack/core'
import { StoreManager } from '@furystack/core/dist/StoreManager'
import { Constructable, Injectable } from '@furystack/inject'
import { sha256 } from 'hash.js'
import { IncomingMessage } from 'http'
import { DefaultSession } from './Models/DefaultSession'

/**
 * Authentication settings object for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpAuthenticationSettings<TUser extends User, TSession extends DefaultSession> {
  public userModel: Constructable<TUser> = User as Constructable<TUser>
  public sessionModel: Constructable<TSession> = DefaultSession as Constructable<TSession>
  public getSession: (msg: IncomingMessage, s: DefaultSession) => Promise<TSession> = async (_msg, session) => {
    return session as TSession
  }
  public getUserStore: (storeManager: StoreManager) => IPhysicalStore<TUser> = () =>
    new InMemoryStore<TUser>({ model: this.userModel, primaryKey: 'username' })
  public getSessionStore: (storeManager: StoreManager) => IPhysicalStore<TSession> = () =>
    new InMemoryStore({ model: this.sessionModel, primaryKey: 'sessionId' })
  public cookieName: string = 'fss'
  public hashMethod: (plain: string) => string = plain =>
    sha256()
      .update(plain)
      .digest('hex')
  public visitorUser: TUser = ({ username: 'Visitor', roles: [] } as any) as TUser
}
