import type { IncomingMessage } from 'http'
import type { CorsOptions } from './models/cors-options.js'
import type { ServerResponse } from 'http'

/**
 * Adds the specified CORS headers to the response
 * @param options The CORS Options object
 * @param incomingMessage The incoming message instance
 * @param serverResponse The outgoing response instance
 */
export const addCorsHeaders = (
  options: CorsOptions,
  incomingMessage: IncomingMessage,
  serverResponse: ServerResponse,
) => {
  if (
    incomingMessage.headers &&
    incomingMessage.headers.origin !== incomingMessage.headers.host &&
    options.origins.some((origin) => origin === incomingMessage.headers.origin)
  ) {
    serverResponse.setHeader('Access-Control-Allow-Origin', incomingMessage.headers.origin as string)
    if (options.credentials) {
      serverResponse.setHeader('Access-Control-Allow-Credentials', 'true')
    }
    if (options.headers && options.headers.length) {
      serverResponse.setHeader('Access-Control-Allow-Headers', options.headers.join(', '))
    }
    if (options.methods && options.methods.length) {
      serverResponse.setHeader('Access-Control-Allow-Methods', options.methods.join(', '))
    }
  }
}
