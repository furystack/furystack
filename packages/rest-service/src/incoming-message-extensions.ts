declare module 'http' {
  export interface IncomingMessage {
    postBody: unknown
  }
}
