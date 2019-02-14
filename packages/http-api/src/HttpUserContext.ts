import { IUser, LoggerCollection, UserContext } from '@furystack/core'
import { Constructable, Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { v1 } from 'uuid'
import { HttpAuthenticationSettings, ILoginUser } from './HttpAuthenticationSettings'
import { IExternalLoginService } from './Models/IExternalLoginService'

/**
 * Injectable UserContext for FuryStack HTTP Api
 */
@Injectable()
export class HttpUserContext<TUser extends IUser> implements UserContext<TUser> {
  public static logScope = '@furystack/http-api/HttpUserContext'
  private user?: TUser

  public async authenticateUser(userName: string, password: string): Promise<TUser> {
    const match = await this.options.users.filter({
      username: userName,
      password: this.options.hashMethod(password),
    } as Partial<ILoginUser<TUser>>)
    if (match.length === 1) {
      return match[0]
    }
    return this.options.visitorUser as TUser
  }

  public async getCurrentUser() {
    if (!this.user) {
      this.user = await this.authenticateRequest(this.incomingMessage)
    }
    return this.user
  }

  private getSessionIdFromRequest(req: IncomingMessage): string | null {
    if (req.headers.cookie) {
      /** */
      const cookies = req.headers.cookie
        .toString()
        .split(';')
        .map(val => {
          const [name, value] = val.split('=')
          return { name: name.trim(), value: value.trim() }
        })
      const sessionCookie = cookies.find(c => c.name === this.options.cookieName)
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
      const session = await this.options.sessions.get(sessionId)
      return (session && (await this.options.users.get(session.Username as any))) || (this.options.visitorUser as TUser)
    }

    return this.options.visitorUser as TUser
  }

  public async cookieLogin(username: string, password: string, serverResponse: ServerResponse): Promise<TUser> {
    const user = await this.authenticateUser(username, password)
    if (user !== this.options.visitorUser) {
      const sessionId = v1()
      await this.options.sessions.update(sessionId, { SessionId: sessionId, Username: user.username })
      serverResponse.setHeader('Set-Cookie', `${this.options.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`)
      this.options.injector.getInstance(LoggerCollection).information({
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
      const instance = this.options.injector.getInstance(service)
      const user = await instance.login(this, ...args)
      if (user.username !== this.options.visitorUser.username) {
        const sessionId = v1()
        await this.options.sessions.update(sessionId, { SessionId: sessionId, Username: user.username })
        serverResponse.setHeader('Set-Cookie', `${this.options.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`)
        this.options.injector.getInstance(LoggerCollection).information({
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
      this.options.injector.getInstance(LoggerCollection).error({
        scope: HttpUserContext.logScope,
        message: `Error during external login with '${service.name}': ${error.message}`,
        data: { error },
      })
    }
    return this.options.visitorUser as TUser
  }

  public async cookieLogout(req: IncomingMessage, serverResponse: ServerResponse) {
    const sessionId = this.getSessionIdFromRequest(req)
    if (sessionId) {
      const user = await this.authenticateRequest(req)
      await this.options.sessions.remove(sessionId)
      serverResponse.setHeader('Set-Cookie', `${this.options.cookieName}=; Path=/; Secure; HttpOnly`)
      this.options.injector.getInstance(LoggerCollection).information({
        scope: HttpUserContext.logScope,
        message: `User '${user.username}' has been logged out.`,
        data: {
          user,
          sessionId,
        },
      })
    }
  }

  constructor(private incomingMessage: IncomingMessage, private options: HttpAuthenticationSettings<TUser>) {}
}
