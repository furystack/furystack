import http from 'http'
import { ActionResult } from './Models'

export interface SendJsonOptions<T> {
  statusCode?: number
  json: T
  headers?: { [K: string]: string }
}
export interface SendPlainTextOptions {
  statusCode?: number
  text: string
  headers?: { [K: string]: string }
}

declare module 'http' {
  export interface ServerResponse {
    sendActionResult: <T>(result: ActionResult<T>) => void
    // sendJson: <T>(options: SendJsonOptions<T>) => void
    // sendPlainText: (options: SendPlainTextOptions) => void
  }
}

http.ServerResponse.prototype.sendActionResult = function<T>(options: ActionResult<T>) {
  this.writeHead(options.statusCode, options.headers)
  this.end(options.chunk)
}

// http.ServerResponse.prototype.sendJson = function<T>(options: SendJsonOptions<T>) {
//   this.writeHead(options.statusCode || 200, {
//     'Content-Type': 'application/json',
//     ...options.headers,
//   })
//   this.end(JSON.stringify(options.json))
// }

// http.ServerResponse.prototype.sendPlainText = function(options: SendPlainTextOptions) {
//   this.writeHead(options.statusCode || 200, {
//     'Content-Type': 'plain/text',
//     ...options.headers,
//   })
//   this.end(options.text)
// }
