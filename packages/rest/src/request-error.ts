/**
 * Throw inside a `RequestAction` to short-circuit with a specific HTTP
 * status. `ErrorAction` translates this to `JsonResult({ message }, responseCode)`.
 * Prefer this over plain `Error` (`furystack/rest-action-use-request-error`
 * enforces this).
 */
export class RequestError extends Error {
  constructor(
    msg: string,
    public readonly responseCode: number,
  ) {
    super(msg)
  }
}
