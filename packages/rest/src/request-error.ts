export class RequestError extends Error {
  constructor(msg: string, public responseCode: number) {
    super(msg)
  }
}
