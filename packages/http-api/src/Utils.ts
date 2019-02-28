import { Injectable } from '@furystack/inject'
import { IncomingMessage, ServerResponse } from 'http'
import { ICorsOptions } from './Models/ICorsOptions'

/**
 * A collection of various HTTP API related utilities
 */
@Injectable({ lifetime: 'transient' })
export class Utils {
  /**
   * Reads the post's body and returns a promise with a parsed value
   * @param incomingMessage The incoming message instance
   */
  public async readPostBody<T>(incomingMessage: IncomingMessage = this.incomingMessage): Promise<T> {
    let body = ''
    await new Promise((resolve, reject) => {
      incomingMessage.on('readable', () => {
        const data = incomingMessage.read()
        if (data) {
          body += data
        }
      })
      incomingMessage.on('end', () => {
        resolve()
      })
      incomingMessage.on('error', err => {
        reject(err)
      })
    })
    return JSON.parse(body) as T
  }

  /**
   * Adds the specified CORS headers to the response
   * @param options The CORS Options object
   * @param incomingMessage The incoming message instance
   * @param serverResponse The outgoing response instance
   */
  public addCorsHeaders(
    options: ICorsOptions,
    incomingMessage: IncomingMessage = this.incomingMessage,
    serverResponse: ServerResponse = this.serverResponse,
  ) {
    if (
      incomingMessage.headers &&
      incomingMessage.headers.origin !== incomingMessage.headers.host &&
      options.origins.some(origin => origin === incomingMessage.headers.origin)
    ) {
      serverResponse.setHeader('Access-Control-Allow-Origin', incomingMessage.headers.origin as string)
      serverResponse.setHeader('Access-Control-Allow-Credentials', 'true')
    }
  }

  constructor(private incomingMessage: IncomingMessage, private serverResponse: ServerResponse) {}
}
