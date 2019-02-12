import { IUser, LoggerCollection, UserContext } from '@furystack/core'
import { Constructable, Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { v1 } from 'uuid'
import { HttpAuthenticationSettings, ILoginUser } from './HttpAuthenticationSettings'
import { IExternalLoginService } from './Models'

/**
 * Injectable UserContext for FuryStack HTTP Api
 */
@Injectable()
export class HttpUserContext<TUser extends IUser> implements UserContext<TUser> {
  public static LogScope = '@furystack/http-api/HttpUserContext'
  private user?: TUser

  public async AuthenticateUser(userName: string, password: string): Promise<TUser> {
    const match = await this.options.Users.filter({
      Username: userName,
      Password: this.options.HashMethod(password),
    } as Partial<ILoginUser<TUser>>)
    if (match.length === 1) {
      return match[0]
    }
    return this.options.VisitorUser as TUser
  }

  public async GetCurrentUser() {
    if (!this.user) {
      this.user = await this.AuthenticateRequest(this.incomingMessage)
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
      const sessionCookie = cookies.find(c => c.name === this.options.CookieName)
      if (sessionCookie) {
        return sessionCookie.value
      }
    }
    return null
  }

  public async AuthenticateRequest(req: IncomingMessage): Promise<TUser> {
    // Basic auth
    if (req.headers.authorization) {
      const authData = Buffer.from(req.headers.authorization.toString().split(' ')[1], 'base64')
      const [userName, password] = authData.toString().split(':')
      return await this.AuthenticateUser(userName, password)
    }

    // Cookie auth
    const sessionId = this.getSessionIdFromRequest(req)
    if (sessionId) {
      const session = await this.options.Sessions.get(sessionId)
      return (session && (await this.options.Users.get(session.Username as any))) || (this.options.VisitorUser as TUser)
    }

    return this.options.VisitorUser as TUser
  }

  public async CookieLogin(username: string, password: string, serverResponse: ServerResponse): Promise<TUser> {
    const user = await this.AuthenticateUser(username, password)
    if (user !== this.options.VisitorUser) {
      const sessionId = v1()
      await this.options.Sessions.update(sessionId, { SessionId: sessionId, Username: user.Username })
      serverResponse.setHeader('Set-Cookie', `${this.options.CookieName}=${sessionId}; Path=/; Secure; HttpOnly`)
      this.options.Injector.GetInstance(LoggerCollection).Information({
        scope: HttpUserContext.LogScope,
        message: `User '${user.Username}' logged in.`,
        data: {
          user,
          sessionId,
        },
      })
    }
    return user
  }

  public async ExternalLogin<T extends IExternalLoginService<TUser, TArgs>, TArgs extends any[]>(
    service: Constructable<T>,
    serverResponse: ServerResponse,
    ...args: TArgs
  ): Promise<TUser> {
    try {
      const instance = this.options.Injector.GetInstance(service)
      const user = await instance.login(this, ...args)
      if (user.Username !== this.options.VisitorUser.Username) {
        const sessionId = v1()
        await this.options.Sessions.update(sessionId, { SessionId: sessionId, Username: user.Username })
        serverResponse.setHeader('Set-Cookie', `${this.options.CookieName}=${sessionId}; Path=/; Secure; HttpOnly`)
        this.options.Injector.GetInstance(LoggerCollection).Information({
          scope: HttpUserContext.LogScope,
          message: `User '${user.Username}' logged in with '${service.name}' external service.`,
          data: {
            user,
            sessionId,
          },
        })
        return user
      }
    } catch (error) {
      /** */
      this.options.Injector.GetInstance(LoggerCollection).Error({
        scope: HttpUserContext.LogScope,
        message: `Error during external login with '${service.name}': ${error.message}`,
        data: { error },
      })
    }
    return this.options.VisitorUser as TUser
  }

  public async CookieLogout(req: IncomingMessage, serverResponse: ServerResponse) {
    const sessionId = this.getSessionIdFromRequest(req)
    if (sessionId) {
      const user = await this.AuthenticateRequest(req)
      await this.options.Sessions.remove(sessionId)
      serverResponse.setHeader('Set-Cookie', `${this.options.CookieName}=; Path=/; Secure; HttpOnly`)
      this.options.Injector.GetInstance(LoggerCollection).Information({
        scope: HttpUserContext.LogScope,
        message: `User '${user.Username}' has been logged out.`,
        data: {
          user,
          sessionId,
        },
      })
    }
  }

  constructor(private incomingMessage: IncomingMessage, private options: HttpAuthenticationSettings<TUser>) {}
}
