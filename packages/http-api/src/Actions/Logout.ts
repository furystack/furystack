import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { HttpUserContext } from '../HttpUserContext'
import { IRequestAction } from '../Models'

/**
 * Action that logs out the current user
 */
@Injectable({ lifetime: 'transient' })
export class LogoutAction implements IRequestAction {
  public dispose() {
    /**  */
  }

  public async exec() {
    await this.userContext.cookieLogout(this.incomingMessage, this.serverResponse)
    this.serverResponse.writeHead(200)
    this.serverResponse.end(JSON.stringify({ success: true }))
  }
  constructor(
    private readonly userContext: HttpUserContext,
    private incomingMessage: IncomingMessage,
    private serverResponse: ServerResponse,
  ) {}
}
