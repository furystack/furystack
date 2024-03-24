export class RequestError extends Error {
  constructor(
    msg: string,
    public readonly responseCode: number,
  ) {
    super(msg)
  }
}
