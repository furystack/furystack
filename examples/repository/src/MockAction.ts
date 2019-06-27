import { IncomingMessage, ServerResponse } from 'http'
import { RequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'

/**
 * Example mock action
 */
@Injectable({ lifetime: 'transient' })
export class MockAction implements RequestAction {
  public async exec() {
    this.response.sendJson({
      json: {
        success: true,
        incoming: {
          url: this.incomingMessage.url,
          headers: this.incomingMessage.headers,
          method: this.incomingMessage.method,
        },
      },
    })
  }

  public dispose() {
    /** */
  }

  constructor(private incomingMessage: IncomingMessage, private response: ServerResponse) {}
}
