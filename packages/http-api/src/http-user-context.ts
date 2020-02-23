import { IncomingMessage, ServerResponse } from 'http'
import { PhysicalStore, User, StoreManager } from '@furystack/core'
import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { sleepAsync } from '@furystack/utils'
import { v1 } from 'uuid'
import { HttpAuthenticationSettings } from './http-authentication-settings'

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
   * Returns if the current user is authenticated
   */
  public async isAuthenticated() {
    try {
      const currentUser = await this.getCurrentUser()
      return currentUser !== null
    } catch (error) {
      return false
    }
  }

  /**
   * Returns if the current user can be authorized with ALL of the specified roles
   * @param roles The list of roles to authorize
   */
  public async isAuthorized(...roles: string[]): Promise<boolean> {
    const currentUser = await this.getCurrentUser()
    for (const role of roles) {
      if (!currentUser || !currentUser.roles.some(c => c === role)) {
        return false
      }
    }
    return true
  }

  /**
   * Checks if the system contains a user with the provided name and password, throws an error otherwise
   */
  public async authenticateUser(userName: string, password: string) {
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
    throw Error('Failed to authenticate.')
  }

  public async getCurrentUser() {
    if (!this.user) {
      this.user = await this.authenticateRequest()
      return this.user
    }
    return this.user
  }

  public getSessionIdFromRequest(): string | null {
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
        throw Error('Inconsistent session result')
      }
    }

    throw Error('Failed to authenticate request')
  }

  /**
   * Creates and sets up a cookie-based session for the provided user
   * @param user The user to create a session for
   * @param serverResponse A serverResponse to set the cookie
   */
  public async cookieLogin(user: User, serverResponse: ServerResponse): Promise<User> {
    const sessionId = v1()
    await this.sessions.add({ sessionId, username: user.username })
    serverResponse.setHeader('Set-Cookie', `${this.authentication.cookieName}=${sessionId}; Path=/; HttpOnly`)
    this.logger.information({
      message: `User '${user.username}' logged in.`,
      data: {
        user,
        sessionId,
      },
    })
    return user
  }

  public async cookieLogout() {
    const sessionId = this.getSessionIdFromRequest()
    if (sessionId) {
      const user = await this.authenticateRequest()
      await this.sessions.remove(sessionId)
      this.serverResponse.setHeader('Set-Cookie', `${this.authentication.cookieName}=; Path=/; HttpOnly`)
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
    public readonly incomingMessage: IncomingMessage,
    public readonly serverResponse: ServerResponse,
    injector: Injector,
    public readonly authentication: HttpAuthenticationSettings<User>,
    storeManager: StoreManager,
  ) {
    this.users = authentication.getUserStore(storeManager)
    this.sessions = authentication.getSessionStore(storeManager)
    this.logger = injector.logger.withScope(`@furystack/http-api/${this.constructor.name}`)
  }
}
