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
  }
}

http.ServerResponse.prototype.sendActionResult = function<T>(options: ActionResult<T>) {
  this.writeHead(options.statusCode, options.headers)
  this.end(options.chunk)
}
