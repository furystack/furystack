import { IncomingMessage, ServerResponse } from 'http'
import { Injectable } from '@furystack/inject'
import { HttpUserContext } from '../HttpUserContext'
import { RequestAction } from '../Models'
import { Utils } from '../Utils'

/**
 * Action that logs in the current user
 * Should be called with a JSON Post body with ``username`` and ``password`` fields.
 * Returns the current user instance
 */
@Injectable({ lifetime: 'transient' })
export class LoginAction implements RequestAction {
  public dispose() {
    /**  */
  }

  public async exec() {
    const loginData = await this.utils.readPostBody<{ username: string; password: string }>(this.incomingMessage)
    const user = await this.userContext.cookieLogin(loginData.username, loginData.password, this.serverResponse)
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
