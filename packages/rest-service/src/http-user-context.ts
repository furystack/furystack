import type { User } from '@furystack/core'
import { StoreManager } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { PasswordAuthenticator, UnauthenticatedError } from '@furystack/security'
import { randomBytes } from 'crypto'
import type { IncomingMessage } from 'http'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import type { DefaultSession } from './models/default-session.js'

/**
 * Injectable UserContext for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'scoped' })
export class HttpUserContext {
  public getUserStore = () => this.authentication.getUserStore(this.storeManager)

  public getSessionStore = () => this.authentication.getSessionStore(this.storeManager)

  private getUserByName = async (userName: string) => {
    const userStore = this.getUserStore()
    const users = await userStore.find({ filter: { username: { $eq: userName } }, top: 2 })
    if (users.length !== 1) {
      throw new UnauthenticatedError()
    }
    return users[0]
  }

  private getSessionById = async (sessionId: string) => {
    const sessionStore = this.getSessionStore()
    const sessions = await sessionStore.find({ filter: { sessionId: { $eq: sessionId } }, top: 2 })
    if (sessions.length !== 1) {
      throw new UnauthenticatedError()
    }
    return sessions[0]
  }

  private user?: User

  /**
   * @param request The request to be authenticated
   * @returns whether the current user is authenticated
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
   * Returns whether the current user can be authorized with ALL of the specified roles
   * @param request The request to be authenticated
   * @param roles The list of roles to authorize
   * @returns a boolean value that indicates whether the user is authorized
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
   * @param userName The username
   * @param password The password
   * @returns the authenticated User
   */
  public async authenticateUser(userName: string, password: string) {
    const result = await this.authenticator.checkPasswordForUser(userName, password)

    if (!result.isValid) {
      throw new UnauthenticatedError()
    }
    const user = await this.getUserByName(userName)
    if (!user) {
      throw new UnauthenticatedError()
    }
    return user
  }

  public async getCurrentUser(request: Pick<IncomingMessage, 'headers'>) {
    if (!this.user) {
      this.user = await this.authenticateRequest(request)
      return this.user
    }
    return this.user
  }

  public getSessionIdFromRequest(request: Pick<IncomingMessage, 'headers'>): string | null {
    if (request.headers.cookie) {
      const cookies = request.headers.cookie
        .toString()
        .split(';')
        .filter((val) => val.length > 0)
        .map((val) => {
          const [name, value] = val.split('=')
          return { name: name?.trim(), value: value?.trim() }
        })
      const sessionCookie = cookies.find((c) => c.name === this.authentication.cookieName)
      if (sessionCookie) {
        return sessionCookie.value
      }
    }
    return null
  }

  public async authenticateRequest(request: Pick<IncomingMessage, 'headers'>): Promise<User> {
    // Basic auth
    if (this.authentication.enableBasicAuth && request.headers.authorization) {
      const authData = Buffer.from(request.headers.authorization.toString().split(' ')[1], 'base64')
      const [userName, password] = authData.toString().split(':')
      return await this.authenticateUser(userName, password)
    }

    // Cookie auth
    const sessionId = this.getSessionIdFromRequest(request)
    if (sessionId) {
      const session = await this.getSessionById(sessionId)
      if (session) {
        const user = await this.getUserByName(session.username)
        if (user) {
          return user
        }
      }
    }

    throw new UnauthenticatedError()
  }

  /**
   * Creates and sets up a cookie-based session for the provided user
   * @param user The user to create a session for
   * @param serverResponse A serverResponse to set the cookie
   * @returns the current User
   */
  public async cookieLogin(
    user: User,
    serverResponse: { setHeader: (header: string, value: string) => void },
  ): Promise<User> {
    const sessionId = randomBytes(32).toString('hex')
    await this.getSessionStore().add({ sessionId, username: user.username })
    serverResponse.setHeader('Set-Cookie', `${this.authentication.cookieName}=${sessionId}; Path=/; HttpOnly`)
    this.user = user
    return user
  }

  public async cookieLogout(
    request: Pick<IncomingMessage, 'headers'>,
    response: { setHeader: (header: string, value: string) => void },
  ) {
    this.user = undefined
    const sessionId = this.getSessionIdFromRequest(request)
    response.setHeader('Set-Cookie', `${this.authentication.cookieName}=; Path=/; HttpOnly`)

    if (sessionId) {
      const sessionStore = this.getSessionStore()
      const sessions = await sessionStore.find({ filter: { sessionId: { $eq: sessionId } } })
      await this.getSessionStore().remove(...sessions.map((s) => s[sessionStore.primaryKey]))
    }
  }

  @Injected(HttpAuthenticationSettings)
  declare public readonly authentication: HttpAuthenticationSettings<User, DefaultSession>

  @Injected(StoreManager)
  declare private readonly storeManager: StoreManager

  @Injected(PasswordAuthenticator)
  declare private readonly authenticator: PasswordAuthenticator

  public init() {
    this.getUserStore().addListener('onEntityUpdated', ({ id, change }) => {
      if (this.user?.username === id) {
        this.user = { ...this.user, ...change }
      }
    })

    this.getUserStore().addListener('onEntityRemoved', ({ key }) => {
      if (this.user?.username === key) {
        this.user = undefined
      }
    })

    this.getSessionStore().addListener('onEntityRemoved', () => {
      this.user = undefined // as user cannot be determined by the session id anymore
    })
  }
}
