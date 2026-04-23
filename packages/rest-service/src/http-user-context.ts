import type { User } from '@furystack/core'
import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineService, type Token } from '@furystack/inject'
import { PasswordAuthenticator, UnauthenticatedError } from '@furystack/security'
import { EventHub, type ListenerErrorPayload } from '@furystack/utils'
import { randomBytes } from 'crypto'
import type { IncomingMessage } from 'http'
import { extractSessionIdFromCookies } from './authentication-providers/helpers.js'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'

/**
 * Events emitted by a per-request {@link HttpUserContext} instance. Since
 * the context is scoped, each request sees its own event stream.
 */
export type HttpUserContextEvents = {
  onLogin: { user: User }
  onLogout: undefined
  onSessionInvalidated: undefined
  onListenerError: ListenerErrorPayload
}

/**
 * Request-scoped authentication/authorization facade.
 *
 * `HttpUserContext` consolidates identity lookup, authentication-provider
 * walk-through and cookie session helpers behind a single object. The
 * `user` cache lives on the per-request scope, so repeated calls within
 * the same request skip re-authentication.
 */
export interface HttpUserContext extends EventHub<HttpUserContextEvents> {
  /** The active {@link HttpAuthenticationSettings} captured at resolve time. */
  readonly authentication: HttpAuthenticationSettings
  /** Whether the current user is authenticated according to the bound providers. */
  isAuthenticated(request: Pick<IncomingMessage, 'headers'>): Promise<boolean>
  /** Returns `true` when the current user has **all** of the supplied roles. */
  isAuthorized(request: Pick<IncomingMessage, 'headers'>, ...roles: string[]): Promise<boolean>
  /** Verifies a username/password pair against the system `PasswordAuthenticator`. */
  authenticateUser(userName: string, password: string): Promise<User>
  /** Returns the cached user for this request or resolves it via the provider chain. */
  getCurrentUser(request: Pick<IncomingMessage, 'headers'>): Promise<User>
  /** Extracts the session id for `request` using the configured cookie name. */
  getSessionIdFromRequest(request: Pick<IncomingMessage, 'headers'>): string | null
  /** Walks the configured authentication providers and returns the first match. */
  authenticateRequest(request: Pick<IncomingMessage, 'headers'>): Promise<User>
  /** Creates and persists a session for `user`, setting the cookie on `response`. */
  cookieLogin(user: User, response: { setHeader: (header: string, value: string) => void }): Promise<User>
  /** Clears the session identified by the request's cookie (if any). */
  cookieLogout(
    request: Pick<IncomingMessage, 'headers'>,
    response: { setHeader: (header: string, value: string) => void },
  ): Promise<void>
}

/**
 * Internal concrete EventHub-backed {@link HttpUserContext}. Exposed via
 * the {@link HttpUserContextToken} token; constructed by its factory.
 */
class HttpUserContextImpl extends EventHub<HttpUserContextEvents> implements HttpUserContext {
  private user: User | undefined

  /**
   * `authenticator` is resolved lazily so that tests (and applications) that
   * never invoke `authenticateUser` don't need to bind password-credential
   * stores.
   */
  constructor(
    public readonly authentication: HttpAuthenticationSettings,
    private readonly resolveAuthenticator: () => PasswordAuthenticator,
    private readonly systemInjector: Injector,
  ) {
    super()
  }

  public async isAuthenticated(request: Pick<IncomingMessage, 'headers'>): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser(request)
      return currentUser !== null
    } catch {
      return false
    }
  }

  public async isAuthorized(request: Pick<IncomingMessage, 'headers'>, ...roles: string[]): Promise<boolean> {
    const currentUser = await this.getCurrentUser(request)
    for (const role of roles) {
      if (!currentUser || !currentUser.roles.some((c) => c === role)) {
        return false
      }
    }
    return true
  }

  public async authenticateUser(userName: string, password: string): Promise<User> {
    const result = await this.resolveAuthenticator().checkPasswordForUser(userName, password)
    if (!result.isValid) {
      throw new UnauthenticatedError()
    }
    const user = await this.getUserByName(userName)
    if (!user) {
      throw new UnauthenticatedError()
    }
    return user
  }

  public async getCurrentUser(request: Pick<IncomingMessage, 'headers'>): Promise<User> {
    if (!this.user) {
      this.user = await this.authenticateRequest(request)
    }
    return this.user
  }

  public getSessionIdFromRequest(request: Pick<IncomingMessage, 'headers'>): string | null {
    return extractSessionIdFromCookies(request, this.authentication.cookieName)
  }

  public async authenticateRequest(request: Pick<IncomingMessage, 'headers'>): Promise<User> {
    for (const provider of this.authentication.authenticationProviders) {
      const user = await provider.authenticate(request)
      if (user) return user
    }
    throw new UnauthenticatedError()
  }

  public async cookieLogin(
    user: User,
    response: { setHeader: (header: string, value: string) => void },
  ): Promise<User> {
    const sessionId = randomBytes(32).toString('hex')
    const sessionDataSet = this.systemInjector.get(this.authentication.sessionDataSet)
    await sessionDataSet.add(this.systemInjector, { sessionId, username: user.username })
    response.setHeader('Set-Cookie', `${this.authentication.cookieName}=${sessionId}; Path=/; HttpOnly`)
    this.user = user
    this.emit('onLogin', { user })
    return user
  }

  public async cookieLogout(
    request: Pick<IncomingMessage, 'headers'>,
    response: { setHeader: (header: string, value: string) => void },
  ): Promise<void> {
    this.user = undefined
    const sessionId = this.getSessionIdFromRequest(request)
    response.setHeader('Set-Cookie', `${this.authentication.cookieName}=; Path=/; HttpOnly`)

    if (sessionId) {
      const sessionDataSet = this.systemInjector.get(this.authentication.sessionDataSet)
      const sessions = await sessionDataSet.find(this.systemInjector, {
        filter: { sessionId: { $eq: sessionId } },
      })
      await sessionDataSet.remove(this.systemInjector, ...sessions.map((s) => s.sessionId))
    }
    this.emit('onLogout', undefined)
  }

  private async getUserByName(userName: string): Promise<User> {
    const userDataSet = this.systemInjector.get(this.authentication.userDataSet)
    const users = await userDataSet.find(this.systemInjector, {
      filter: { username: { $eq: userName } },
      top: 2,
    })
    if (users.length !== 1) {
      throw new UnauthenticatedError()
    }
    return users[0]
  }
}

/**
 * DI token for the per-request {@link HttpUserContext}. Scoped — each HTTP
 * request resolves its own instance with a fresh `user` cache.
 */
export const HttpUserContext: Token<HttpUserContext, 'scoped'> = defineService({
  name: 'furystack/rest-service/HttpUserContext',
  lifetime: 'scoped',
  factory: ({ inject, injector, onDispose }): HttpUserContext => {
    const authentication = inject(HttpAuthenticationSettings)
    const systemInjector = useSystemIdentityContext({ injector, username: 'HttpUserContext' })
    onDispose(() => systemInjector[Symbol.asyncDispose]())
    // Password authenticator resolution is deferred: tests that exercise only
    // unauthenticated endpoints never have to bind credential stores.
    return new HttpUserContextImpl(authentication, () => injector.get(PasswordAuthenticator), systemInjector)
  },
})
