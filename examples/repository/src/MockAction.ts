import { IRequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'

/**
 * Example mock action
 */
@Injectable({ lifetime: 'transient' })
export class MockAction implements IRequestAction {
  public async exec() {
    
    this.response.writeHead(200, {
      'Content-Type': 'application/json',
    })
    this.response.end(
      JSON.stringify({
        success: true,
        incoming: {
          url: this.incomingMessage.url,
          headers: this.incomingMessage.headers,
          method: this.incomingMessage.method,
        },
      }),
    )
  }

  public dispose() {
    /** */
  }

  constructor(private incomingMessage: IncomingMessage, private response: ServerResponse) {}
}
