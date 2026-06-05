/**
 * Internal sentinel thrown by `awaitChildren` on first invocation to suspend
 * the handler and release the worker slot. The runner catches it, transitions
 * the task to `waiting`, and persists. Never leaks to application code.
 */
export class SuspendedError extends Error {
  public readonly awaitedChildIds: string[]

  constructor(awaitedChildIds: string[]) {
    super('Task suspended — awaiting children')
    this.name = 'SuspendedError'
    this.awaitedChildIds = awaitedChildIds
  }
}

/**
 * Guards the {@link SuspendedError} sentinel so the runner can distinguish a
 * handler suspension (re-enqueue as `waiting`) from a genuine failure.
 * Handlers must never catch-all in a way that swallows it.
 */
export const isSuspendedError = (value: unknown): value is SuspendedError => value instanceof SuspendedError
