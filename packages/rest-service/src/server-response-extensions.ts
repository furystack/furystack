import http from 'http'
import type { ActionResult } from './request-action-implementation'

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

http.ServerResponse.prototype.sendActionResult = function <T>(options: ActionResult<T>) {
  if (typeof options.chunk === 'object') {
    options.chunk = JSON.stringify(options.chunk) as any
  }
  if (typeof options.chunk === 'string' && options.chunk === 'BypassResult') {
    return
  }
  this.writeHead(options.statusCode, options.headers)
  this.end(options.chunk)
}
