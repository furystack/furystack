import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { IRequestAction } from '../Models'

/**
 * Default fall back "Not Found" (404) action
 */
@Injectable({ lifetime: 'transient' })
export class NotFoundAction implements IRequestAction {
  public async dispose() {
    /**  */
  }
  public async exec(): Promise<void> {
    this.serverResponse.writeHead(404, 'NOT FOUND :(')
    this.serverResponse.end(JSON.stringify({ Error: 'Content not found', url: this.incomingMessage.url }))
  }

  constructor(private incomingMessage: IncomingMessage, private serverResponse: ServerResponse) {}
}
