import { IUser, LoggerCollection, UserContext } from '@furystack/core'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { v1 } from 'uuid'
import { ILoginUser } from './HttpAuthenticationSettings'
import { IExternalLoginService } from './Models/IExternalLoginService'
import { HttpAuthentication } from './HttpAuthentication'

/**
 * Injectable UserContext for FuryStack HTTP Api
 */
@Injectable()
export class HttpUserContext<TUser extends IUser> implements UserContext<TUser> {
  public static logScope = '@furystack/http-api/HttpUserContext'
  private user?: TUser

  public async authenticateUser(userName: string, password: string): Promise<TUser> {
    const match = await this.authentication.settings.users.filter({
      username: userName,
      password: this.authentication.settings.hashMethod(password),
    } as Partial<ILoginUser<TUser>>)
    if (match.length === 1) {
      return match[0]
    }
    return this.authentication.settings.visitorUser as TUser
  }

  public async getCurrentUser() {
    if (!this.user) {
      this.user = await this.authenticateRequest(this.incomingMessage)
    }
    return this.user
  }

  private getSessionIdFromRequest(req: IncomingMessage): string | null {
    if (req.headers.cookie) {
      const cookies = req.headers.cookie
        .toString()
        .split(';')
        .map(val => {
          const [name, value] = val.split('=')
          return { name: name.trim(), value: value.trim() }
        })
      const sessionCookie = cookies.find(c => c.name === this.authentication.settings.cookieName)
      if (sessionCookie) {
        return sessionCookie.value
      }
    }
    return null
  }

  public async authenticateRequest(req: IncomingMessage): Promise<TUser> {
    // Basic auth
    if (req.headers.authorization) {
      const authData = Buffer.from(req.headers.authorization.toString().split(' ')[1], 'base64')
      const [userName, password] = authData.toString().split(':')
      return await this.authenticateUser(userName, password)
    }

    // Cookie auth
    const sessionId = this.getSessionIdFromRequest(req)
    if (sessionId) {
      const session = await this.authentication.settings.sessions.get(sessionId)
      return (
        (session && (await this.authentication.settings.users.get(session.Username as any))) ||
        (this.authentication.settings.visitorUser as TUser)
      )
    }

    return this.authentication.settings.visitorUser as TUser
  }

  public async cookieLogin(username: string, password: string, serverResponse: ServerResponse): Promise<TUser> {
    const user = await this.authenticateUser(username, password)
    if (user !== this.authentication.settings.visitorUser) {
      const sessionId = v1()
      await this.authentication.settings.sessions.update(sessionId, { SessionId: sessionId, Username: user.username })
      serverResponse.setHeader(
        'Set-Cookie',
        `${this.authentication.settings.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`,
      )
      this.injector.getInstance(LoggerCollection).information({
        scope: HttpUserContext.logScope,
        message: `User '${user.username}' logged in.`,
        data: {
          user,
          sessionId,
        },
      })
    }
    return user
  }

  public async externalLogin<T extends IExternalLoginService<TUser, TArgs>, TArgs extends any[]>(
    service: Constructable<T>,
    serverResponse: ServerResponse,
    ...args: TArgs
  ): Promise<TUser> {
    try {
      const instance = this.injector.getInstance(service)
      const user = await instance.login(this, ...args)
      if (user.username !== this.authentication.settings.visitorUser.username) {
        const sessionId = v1()
        await this.authentication.settings.sessions.update(sessionId, { SessionId: sessionId, Username: user.username })
        serverResponse.setHeader(
          'Set-Cookie',
          `${this.authentication.settings.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`,
        )
        this.injector.getInstance(LoggerCollection).information({
          scope: HttpUserContext.logScope,
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
      this.injector.getInstance(LoggerCollection).error({
        scope: HttpUserContext.logScope,
        message: `Error during external login with '${service.name}': ${error.message}`,
        data: { error },
      })
    }
    return this.authentication.settings.visitorUser as TUser
  }

  public async cookieLogout(req: IncomingMessage, serverResponse: ServerResponse) {
    const sessionId = this.getSessionIdFromRequest(req)
    if (sessionId) {
      const user = await this.authenticateRequest(req)
      await this.authentication.settings.sessions.remove(sessionId)
      serverResponse.setHeader('Set-Cookie', `${this.authentication.settings.cookieName}=; Path=/; Secure; HttpOnly`)
      this.injector.getInstance(LoggerCollection).information({
        scope: HttpUserContext.logScope,
        message: `User '${user.username}' has been logged out.`,
        data: {
          user,
          sessionId,
        },
      })
    }
  }

  constructor(
    private incomingMessage: IncomingMessage,
    private injector: Injector,
    private authentication: HttpAuthentication<TUser>,
  ) {}
}
