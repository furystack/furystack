import { IncomingMessage, ServerResponse } from 'http'
import { HttpUserContext, RequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { GoogleLoginService } from './GoogleLoginService'
/**
 * HTTP Request action for Google Logins
 */
@Injectable({ lifetime: 'transient' })
export class GoogleLoginAction implements RequestAction {
  constructor(
    private readonly userContext: HttpUserContext,
    private incomingMessage: IncomingMessage,
    private response: ServerResponse,
  ) {}

  public async exec(): Promise<void> {
    const loginData = await this.incomingMessage.readPostBody<{ token: string }>()
    const user = await this.userContext.externalLogin(GoogleLoginService, this.response, loginData.token)
    this.response.sendJson({ json: user })
  }
  public dispose() {
    /** */
  }
}
