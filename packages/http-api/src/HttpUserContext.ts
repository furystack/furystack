import { IncomingMessage, ServerResponse } from 'http'
import { PhysicalStore, User, StoreManager } from '@furystack/core'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { sleepAsync, filterAsync } from '@sensenet/client-utils'
import { v1 } from 'uuid'
import { HttpAuthenticationSettings } from './HttpAuthenticationSettings'
import { ExternalLoginService } from './Models/ExternalLoginService'

/**
 * Injectable UserContext for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'scoped' })
export class HttpUserContext {
  public users: PhysicalStore<User & { password: string }>

  public sessions!: PhysicalStore<{
    sessionId: string
    username: string
  }>

  private user?: User

  /**
   * Returns if the current user is authenticated (e.g. is NOT a visitor)
   */
  public async isAuthenticated() {
    const currentUser = await this.getCurrentUser()
    return currentUser !== this.authentication.visitorUser
  }

  /**
   * Returns if the current user can be authorized with ALL of the specified roles
   * @param roles The list of roles to authorize
   */
  public async isAuthorized(...roles: string[]): Promise<boolean> {
    const currentUser = await this.getCurrentUser()
    for (const role of roles) {
      if (!currentUser.roles.some(c => c === role)) {
        return false
      }
    }
    return true
  }

  /**
   * Checks if the system contains a user with the provided name and password, returns the Visitor user othervise
   */
  public async authenticateUser(userName: string, password: string): Promise<User> {
    const match =
      (password &&
        password.length &&
        (await this.users.search({
          filter: {
            username: userName,
            password: this.authentication.hashMethod(password),
          },
        }))) ||
      []
    if (match.length === 1) {
      // eslint-disable-next-line no-shadow
      const { password, ...user } = match[0]
      return user
    }
    await sleepAsync(Math.random() * 1000)
    return this.authentication.visitorUser
  }

  public async getCurrentUser() {
    if (!this.user) {
      this.user = await this.authenticateRequest()
    }
    return this.user
  }

  private getSessionIdFromRequest(): string | null {
    if (this.incomingMessage.headers.cookie) {
      const cookies = this.incomingMessage.headers.cookie
        .toString()
        .split(';')
        .filter(val => val.length > 0)
        .map(val => {
          const [name, value] = val.split('=')
          return { name: name.trim(), value: value.trim() }
        })
      const sessionCookie = cookies.find(c => c.name === this.authentication.cookieName)
      if (sessionCookie) {
        return sessionCookie.value
      }
    }
    return null
  }

  public async authenticateRequest(): Promise<User> {
    // Basic auth
    if (this.authentication.enableBasicAuth && this.incomingMessage.headers.authorization) {
      const authData = Buffer.from(this.incomingMessage.headers.authorization.toString().split(' ')[1], 'base64')
      const [userName, password] = authData.toString().split(':')
      return await this.authenticateUser(userName, password)
    }

    // Cookie auth
    const sessionId = this.getSessionIdFromRequest()
    if (sessionId) {
      const session = await this.sessions.get(sessionId)
      if (session) {
        const userResult = await this.users.search({
          filter: {
            username: session.username,
          },
        })
        if (userResult.length === 1) {
          const { password, ...user } = userResult[0]
          return user
        }
        return this.authentication.visitorUser as User
      }
    }

    return this.authentication.visitorUser as User
  }

  public async cookieLogin(username: string, password: string, serverResponse: ServerResponse): Promise<User> {
    const user = await this.authenticateUser(username, password)
    if (user !== this.authentication.visitorUser) {
      const sessionId = v1()
      await this.sessions.update(sessionId, { sessionId, username: user.username })
      serverResponse.setHeader('Set-Cookie', `${this.authentication.cookieName}=${sessionId}; Path=/; HttpOnly`)
      this.logger.information({
        message: `User '${user.username}' logged in.`,
        data: {
          user,
          sessionId,
        },
      })
    }
    return user
  }

  public async externalLogin<T extends ExternalLoginService, TArgs extends any[]>(
    service: Constructable<T>,
    serverResponse: ServerResponse,
    ...args: TArgs
  ): Promise<User> {
    try {
      const instance = this.injector.getInstance(service)
      const user = await instance.login(...args)
      if (user.username !== this.authentication.visitorUser.username) {
        const sessionId = v1()
        await this.sessions.update(sessionId, { sessionId, username: user.username })
        serverResponse.setHeader(
          'Set-Cookie',
          `${this.authentication.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`,
        )
        this.logger.information({
          message: `User '${user.username}' logged in with '${service.name}' external service.`,
          data: {
            user,
            sessionId,
          },
        })
        return user
      }
    } catch (error) {
      /** */
      this.logger.error({
        message: `Error during external login with '${service.name}': ${error.message}`,
        data: { error },
      })
    }
    return this.authentication.visitorUser as User
  }

  public async cookieLogout() {
    const sessionId = this.getSessionIdFromRequest()
    if (sessionId) {
      const user = await this.authenticateRequest()
      await this.sessions.remove(sessionId)
      this.serverResponse.setHeader('Set-Cookie', `${this.authentication.cookieName}=; Path=/; Secure; HttpOnly`)
      this.logger.information({
        message: `User '${user.username}' has been logged out.`,
        data: {
          user,
          sessionId,
        },
      })
    }
  }

  private readonly logger: ScopedLogger

  constructor(
    private readonly incomingMessage: IncomingMessage,
    private readonly serverResponse: ServerResponse,
    private readonly injector: Injector,
    public readonly authentication: HttpAuthenticationSettings<User>,
    storeManager: StoreManager,
  ) {
    this.users = authentication.getUserStore(storeManager)
    this.sessions = authentication.getSessionStore(storeManager)
    this.logger = injector.logger.withScope(`@furystack/http-api/${this.constructor.name}`)
  }
}
