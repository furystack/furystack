import http from 'http'
import { ActionResult } from './models/request-action'

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
  if (typeof options.chunk === 'string' && options.chunk === 'BypassResult') {
    return
  }
  this.writeHead(options.statusCode, options.headers)
  this.end(options.chunk)
}
