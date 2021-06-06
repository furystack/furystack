import { IncomingMessage, ServerResponse } from 'http'
import { User, StoreManager } from '@furystack/core'
import { Injectable } from '@furystack/inject'
import { v1 } from 'uuid'
import { HttpAuthenticationSettings } from './http-authentication-settings'
import { DefaultSession } from 'models/default-session'

/**
 * Injectable UserContext for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'scoped' })
export class HttpUserContext {
  public getUserStore = () => this.authentication.getUserStore(this.storeManager)

  public getSessionStore = () => this.authentication.getSessionStore(this.storeManager)

  private user?: User

  /**
   * @param request The request to be authenticated
   * @returns if the current user is authenticated
   */
  public async isAuthenticated(request: IncomingMessage) {
    try {
      const currentUser = await this.getCurrentUser(request)
      return currentUser !== null
    } catch (error) {
      return false
    }
  }

  /**
   * Returns if the current user can be authorized with ALL of the specified roles
   *
   * @param request The request to be authenticated
   * @param roles The list of roles to authorize
   * @returns a boolean value that indicates if the user is authenticated
   */
  public async isAuthorized(request: IncomingMessage, ...roles: string[]): Promise<boolean> {
    const currentUser = await this.getCurrentUser(request)
    for (const role of roles) {
      if (!currentUser || !currentUser.roles.some((c) => c === role)) {
        return false
      }
    }
    return true
  }

  /**
   * Checks if the system contains a user with the provided name and password, throws an error otherwise
   *
   * @param userName The username
   * @param password The password
   * @returns the authenticated User
   */
  public async authenticateUser(userName: string, password: string) {
    const match =
      (password &&
        password.length &&
        (await this.getUserStore().find({
          filter: {
            username: { $eq: userName },
            password: { $eq: this.authentication.hashMethod(password) },
          },
        }))) ||
      []
    if (match.length === 1) {
      const { password: pw, ...user } = match[0]
      return user
    }
    throw Error('Failed to authenticate.')
  }

  public async getCurrentUser(request: IncomingMessage) {
    if (!this.user) {
      this.user = await this.authenticateRequest(request)
      return this.user
    }
    return this.user
  }

  public getSessionIdFromRequest(request: IncomingMessage): string | null {
    if (request.headers.cookie) {
      const cookies = request.headers.cookie
        .toString()
        .split(';')
        .filter((val) => val.length > 0)
        .map((val) => {
          const [name, value] = val.split('=')
          return { name: name.trim(), value: value.trim() }
        })
      const sessionCookie = cookies.find((c) => c.name === this.authentication.cookieName)
      if (sessionCookie) {
        return sessionCookie.value
      }
    }
    return null
  }

  public async authenticateRequest(request: IncomingMessage): Promise<User> {
    // Basic auth
    if (this.authentication.enableBasicAuth && request.headers.authorization) {
      const authData = Buffer.from(request.headers.authorization.toString().split(' ')[1], 'base64')
      const [userName, password] = authData.toString().split(':')
      return await this.authenticateUser(userName, password)
    }

    // Cookie auth
    const sessionId = this.getSessionIdFromRequest(request)
    if (sessionId) {
      const [session] = await this.getSessionStore().find({ filter: { sessionId: { $eq: sessionId } }, top: 2 })
      if (session) {
        const userResult = await this.getUserStore().find({
          filter: {
            username: { $eq: session.username },
          },
          top: 2,
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
   *
   * @param user The user to create a session for
   * @param serverResponse A serverResponse to set the cookie
   * @returns the current User
   */
  public async cookieLogin(user: User, serverResponse: ServerResponse): Promise<User> {
    const sessionId = v1()
    await this.getSessionStore().add({ sessionId, username: user.username })
    serverResponse.setHeader('Set-Cookie', `${this.authentication.cookieName}=${sessionId}; Path=/; HttpOnly`)
    this.user = user
    return user
  }

  public async cookieLogout(request: IncomingMessage, response: ServerResponse) {
    const sessionId = this.getSessionIdFromRequest(request)
    response.setHeader('Set-Cookie', `${this.authentication.cookieName}=; Path=/; HttpOnly`)
    this.user = undefined
    if (sessionId) {
      const sessionStore = this.getSessionStore()
      const sessions = await sessionStore.find({ filter: { sessionId: { $eq: sessionId } } })
      await this.getSessionStore().remove(...sessions.map((s) => s[sessionStore.primaryKey]))
    }
  }

  constructor(
    public readonly authentication: HttpAuthenticationSettings<User, DefaultSession>,
    private readonly storeManager: StoreManager,
  ) {}
}
