import http from 'http'
import { Utils } from './utils.js'

declare module 'http' {
  export interface IncomingMessage {
    readPostBodyRaw: () => Promise<string>
    readPostBody: <T>() => Promise<T>
    postBody: unknown
  }
}

http.IncomingMessage.prototype.readPostBody = async function <T>() {
  const utils = new Utils()
  return await utils.readPostBody<T>(this)
}

http.IncomingMessage.prototype.readPostBodyRaw = async function () {
  const utils = new Utils()
  return await utils.readPostBodyRaw(this)
}
