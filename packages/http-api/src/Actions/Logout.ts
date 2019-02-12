import { IUser } from '@furystack/core'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { HttpUserContext } from '../HttpUserContext'
import { IRequestAction } from '../Models'

/**
 * Action that logs out the current user
 */
@Injectable()
export class LogoutAction implements IRequestAction {
  public dispose() {
    /**  */
  }

  public async exec() {
    await this.userContext.CookieLogout(this.incomingMessage, this.serverResponse)
    this.serverResponse.writeHead(200)
    this.serverResponse.end(JSON.stringify({ success: true }))
  }
  constructor(
    private readonly userContext: HttpUserContext<IUser>,
    private incomingMessage: IncomingMessage,
    private serverResponse: ServerResponse,
  ) {}
}
