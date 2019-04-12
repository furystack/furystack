import { IRequestAction } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { ServerResponse } from 'http'

/**
 * Example mock action
 */
@Injectable({ lifetime: 'transient' })
export class MockAction implements IRequestAction {
  public async exec() {
    this.response.writeHead(200, {
      'Content-Type': 'text/plain',
    })
    this.response.end('MockResponse')
  }

  public dispose() {
    /** */
  }

  constructor(private response: ServerResponse) {}
}
