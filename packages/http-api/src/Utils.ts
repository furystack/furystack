import { IncomingMessage, ServerResponse } from 'http'
import { Injectable } from '@furystack/inject'
import { CorsOptions } from './Models/CorsOptions'

/**
 * A collection of various HTTP API related utilities
 */
@Injectable({ lifetime: 'transient' })
export class Utils {
  /**
   * Reads the post's body and returns a promise with a parsed value
   * @param incomingMessage The incoming message instance
   */
  public async readPostBody<T>(incomingMessage: IncomingMessage): Promise<T> {
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
  public addCorsHeaders(options: CorsOptions, incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
    if (
      incomingMessage.headers &&
      incomingMessage.headers.origin !== incomingMessage.headers.host &&
      options.origins.some(origin => origin === incomingMessage.headers.origin)
    ) {
      serverResponse.setHeader('Access-Control-Allow-Origin', incomingMessage.headers.origin as string)
      serverResponse.setHeader('Access-Control-Allow-Credentials', 'true')
      if (options.headers && options.headers.length) {
        serverResponse.setHeader('Access-Control-Allow-Headers', options.headers.join(', '))
      }
      if (options.methods && options.methods.length) {
        serverResponse.setHeader('Access-Control-Allow-Methods', options.methods.join(', '))
      }
    }
  }
}
