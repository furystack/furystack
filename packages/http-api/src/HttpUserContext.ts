import { IPhysicalStore, IUser, UserContext } from '@furystack/core'
import { StoreManager } from '@furystack/core/dist/StoreManager'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { sleepAsync } from '@sensenet/client-utils'
import { IncomingMessage, ServerResponse } from 'http'
import { v1 } from 'uuid'
import { HttpAuthenticationSettings, ILoginUser } from './HttpAuthenticationSettings'
import { IExternalLoginService } from './Models/IExternalLoginService'

/**
 * Injectable UserContext for FuryStack HTTP Api
 */
@Injectable({ lifetime: 'scoped' })
export class HttpUserContext<TUser extends IUser> implements UserContext<TUser> {
  public users: IPhysicalStore<ILoginUser<TUser>, 'username'>
  public static logScope = '@furystack/http-api/HttpUserContext'
  private user?: TUser

  public async authenticateUser(userName: string, password: string): Promise<TUser> {
    const match = await this.users.filter({
      username: userName,
      password: this.authentication.hashMethod(password),
    } as Partial<ILoginUser<TUser>>)
    if (match.length === 1) {
      // tslint:disable-next-line: no-shadowed-variable
      const { password, ...user } = match[0]
      return (user as any) as TUser
    }

    await sleepAsync(Math.random() * 5000)

    return this.authentication.visitorUser as TUser
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
      const sessionCookie = cookies.find(c => c.name === this.authentication.cookieName)
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
      const session = await this.authentication.sessions.get(sessionId)
      const u =
        (session &&
          (await this.users.filter({ username: session.Username as string } as Partial<ILoginUser<TUser>>))[0]) ||
        (this.authentication.visitorUser as TUser)
      const { password, ...user } = u as TUser & { password: string }
      return (user as any) as TUser
    }

    return this.authentication.visitorUser as TUser
  }

  public async cookieLogin(username: string, password: string, serverResponse: ServerResponse): Promise<TUser> {
    const user = await this.authenticateUser(username, password)
    if (user !== this.authentication.visitorUser) {
      const sessionId = v1()
      await this.authentication.sessions.update(sessionId, { SessionId: sessionId, Username: user.username })
      serverResponse.setHeader('Set-Cookie', `${this.authentication.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`)
      this.injector.logger.information({
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
      const instance = this.injector.getInstance(service, true)
      const user = await instance.login(...args)
      if (user.username !== this.authentication.visitorUser.username) {
        const sessionId = v1()
        await this.authentication.sessions.update(sessionId, { SessionId: sessionId, Username: user.username })
        serverResponse.setHeader(
          'Set-Cookie',
          `${this.authentication.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`,
        )
        this.injector.logger.information({
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
      this.injector.logger.error({
        scope: HttpUserContext.logScope,
        message: `Error during external login with '${service.name}': ${error.message}`,
        data: { error },
      })
    }
    return this.authentication.visitorUser as TUser
  }

  public async cookieLogout(req: IncomingMessage, serverResponse: ServerResponse) {
    const sessionId = this.getSessionIdFromRequest(req)
    if (sessionId) {
      const user = await this.authenticateRequest(req)
      await this.authentication.sessions.remove(sessionId)
      serverResponse.setHeader('Set-Cookie', `${this.authentication.cookieName}=; Path=/; Secure; HttpOnly`)
      this.injector.logger.information({
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
    private readonly incomingMessage: IncomingMessage,
    private readonly injector: Injector,
    public readonly authentication: HttpAuthenticationSettings<TUser>,
    storeManager: StoreManager,
  ) {
    this.users = authentication.getUserStore(storeManager)
  }
}
