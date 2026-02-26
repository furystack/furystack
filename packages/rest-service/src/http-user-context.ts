import type { User } from '@furystack/core'
import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { PasswordAuthenticator, UnauthenticatedError } from '@furystack/security'
import { randomBytes } from 'crypto'
import type { IncomingMessage } from 'http'
import { extractSessionIdFromCookies } from './authentication-providers/helpers.js'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import type { DefaultSession } from './models/default-session.js'

/**
 * Injectable UserContext for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'scoped' })
export class HttpUserContext {
  public getUserDataSet = () => this.authentication.getUserDataSet(this.systemInjector)

  public getSessionDataSet = () => this.authentication.getSessionDataSet(this.systemInjector)

  private getUserByName = async (userName: string) => {
    const userDataSet = this.getUserDataSet()
    const users = await userDataSet.find(this.systemInjector, { filter: { username: { $eq: userName } }, top: 2 })
    if (users.length !== 1) {
      throw new UnauthenticatedError()
    }
    return users[0]
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
    return extractSessionIdFromCookies(request, this.authentication.cookieName)
  }

  /**
   * Iterates registered authentication providers in order.
   * - A provider returning `User` means authentication succeeded.
   * - A provider returning `null` means it does not apply; try the next one.
   * - A provider throwing means it owns the request but auth failed; propagate the error.
   */
  public async authenticateRequest(request: Pick<IncomingMessage, 'headers'>): Promise<User> {
    for (const provider of this.authentication.authenticationProviders) {
      const user = await provider.authenticate(request)
      if (user) return user
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
    await this.getSessionDataSet().add(this.systemInjector, { sessionId, username: user.username })
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
      const sessionDataSet = this.getSessionDataSet()
      const sessions = await sessionDataSet.find(this.systemInjector, { filter: { sessionId: { $eq: sessionId } } })
      await sessionDataSet.remove(this.systemInjector, ...sessions.map((s) => s[sessionDataSet.primaryKey]))
    }
  }

  @Injected(HttpAuthenticationSettings)
  declare public readonly authentication: HttpAuthenticationSettings<User, DefaultSession>

  @Injected((injector: Injector) => useSystemIdentityContext({ injector, username: 'HttpUserContext' }))
  declare private readonly systemInjector: Injector

  @Injected(PasswordAuthenticator)
  declare private readonly authenticator: PasswordAuthenticator

  public init() {
    this.getUserDataSet().addListener('onEntityUpdated', ({ id, change }) => {
      if (this.user?.username === id) {
        this.user = { ...this.user, ...change }
      }
    })

    this.getUserDataSet().addListener('onEntityRemoved', ({ key }) => {
      if (this.user?.username === key) {
        this.user = undefined
      }
    })

    this.getSessionDataSet().addListener('onEntityRemoved', () => {
      this.user = undefined
    })
  }
}
