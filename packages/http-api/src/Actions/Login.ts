import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { HttpUserContext } from '../HttpUserContext'
import { IRequestAction } from '../Models'
import { Utils } from '../Utils'

/**
 * Action that logs in the current user
 */
@Injectable({ lifetime: 'transient' })
export class LoginAction implements IRequestAction {
  public dispose() {
    /**  */
  }

  public async exec() {
    const loginData = await this.utils.readPostBody<{ username: string; password: string }>(this.incomingMessage)
    const user = await this.userContext.cookieLogin({
      username: loginData.username,
      password: loginData.password,
      response: this.serverResponse,
      request: this.incomingMessage,
    })
    this.serverResponse.writeHead(200, {
      'Content-Type': 'application/json',
    })
    this.serverResponse.end(JSON.stringify(user))
  }
  constructor(
    private readonly userContext: HttpUserContext,
    private incomingMessage: IncomingMessage,
    private serverResponse: ServerResponse,
    private utils: Utils,
  ) {}
}
