import { IncomingMessage, ServerResponse } from 'http'
import { Injectable } from '@furystack/inject'
import { HttpUserContext } from '../HttpUserContext'
import { RequestAction } from '../Models'

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
    const loginData = await this.incomingMessage.readPostBody<{ username: string; password: string }>()
    const user = await this.userContext.cookieLogin(loginData.username, loginData.password, this.serverResponse)
    if (user === this.userContext.authentication.visitorUser) {
      this.serverResponse.sendJson({
        statusCode: 400,
        json: { message: 'Login failed' },
      })
    }
    this.serverResponse.sendJson({ json: user })
  }
  constructor(
    private readonly userContext: HttpUserContext,
    private incomingMessage: IncomingMessage,
    private serverResponse: ServerResponse,
  ) {}
}
