import { IncomingMessage, ServerResponse } from 'http'
import { Injectable } from '@furystack/inject'
import { HttpUserContext } from '../HttpUserContext'
import { RequestAction } from '../Models'

/**
 * Action that logs out the current user
 */
@Injectable({ lifetime: 'transient' })
export class LogoutAction implements RequestAction {
  public dispose() {
    /**  */
  }

  public async exec() {
    await this.userContext.cookieLogout(this.incomingMessage, this.serverResponse)
    this.serverResponse.sendJson({ json: { success: true } })
  }
  constructor(
    private readonly userContext: HttpUserContext,
    private incomingMessage: IncomingMessage,
    private serverResponse: ServerResponse,
  ) {}
}
