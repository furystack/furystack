import http from 'http'
import { Utils } from './utils'

declare module 'http' {
  export interface IncomingMessage {
    readPostBody: <T>() => Promise<T>
  }
}

http.IncomingMessage.prototype.readPostBody = async function <T>() {
  const utils = new Utils()
  return await utils.readPostBody<T>(this)
}
