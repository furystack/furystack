/**
 * Thrown by the client returned from `createClient` when `response.ok` is
 * `false`. Carries the raw `Response` so callers can read the status,
 * headers, or attempt their own body parsing.
 */
export class ResponseError extends Error {
  constructor(
    message: string,
    public response: Response,
  ) {
    super(message)
  }
}
