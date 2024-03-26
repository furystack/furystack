import http from 'http'
import { readPostBody, readPostBodyRaw } from './read-post-body.js'

declare module 'http' {
  export interface IncomingMessage {
    readPostBodyRaw: () => Promise<string>
    readPostBody: <T>() => Promise<T>
    postBody: unknown
  }
}

http.IncomingMessage.prototype.readPostBody = async function <T>() {
  return await readPostBody<T>(this)
}

http.IncomingMessage.prototype.readPostBodyRaw = async function () {
  return await readPostBodyRaw(this)
}
