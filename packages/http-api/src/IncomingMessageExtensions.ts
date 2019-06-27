import http from 'http'
import { Utils } from './Utils'

declare module 'http' {
  export interface IncomingMessage {
    readPostBody: <T>() => Promise<T>
  }
}

http.IncomingMessage.prototype.readPostBody = async function<T>() {
  const utils = new Utils(this, null as any)
  return await utils.readPostBody<T>(this)
}
