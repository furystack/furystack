/**
 * Error raised when a task-runner REST/upload call fails. Carries the
 * server-supplied `code` (the discriminated `{ code, message }` body the
 * endpoints emit) and the HTTP `status` so callers can branch
 * exhaustively instead of substring-matching the message.
 */
export class TaskRunnerClientError extends Error {
  public readonly code: string
  public readonly status: number

  constructor(args: { code: string; message: string; status: number }) {
    super(args.message)
    this.name = 'TaskRunnerClientError'
    this.code = args.code
    this.status = args.status
  }

  /** Runtime type guard. */
  public static is(value: unknown): value is TaskRunnerClientError {
    return value instanceof TaskRunnerClientError
  }
}
