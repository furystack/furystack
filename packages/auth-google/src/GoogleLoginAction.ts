import { IUser } from '@furystack/core'
import { HttpUserContext, IRequestAction, Utils } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { GoogleLoginService } from './GoogleLoginService'
/**
 * HTTP Request action for Google Logins
 */
@Injectable()
export class GoogleLoginAction implements IRequestAction {
  constructor(
    private readonly userContext: HttpUserContext<IUser>,
    private incomingMessage: IncomingMessage,
    private response: ServerResponse,
    private utils: Utils,
  ) {}

  public async exec(): Promise<void> {
    const loginData = await this.utils.readPostBody<{ token: string }>(this.incomingMessage)
    this.response.statusCode = 200
    this.response.setHeader('Content-Type', 'application/json')
    const user = await this.userContext.externalLogin(GoogleLoginService, this.response, loginData.token)
    this.response.write(JSON.stringify(user))
    this.response.end()
  }
  public dispose() {
    /** */
  }
}
